package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/gabmetal/alpacard/api/internal/auth"
	"github.com/gabmetal/alpacard/api/internal/metrics"
	"github.com/gabmetal/alpacard/api/internal/models"
	"github.com/google/uuid"
)

type RegisterRequest struct {
	Email    string      `json:"email"`
	Password string      `json:"password"`
	Name     string      `json:"name"`
	Role     models.Role `json:"role"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Token string       `json:"token"`
	User  *models.User `json:"user"`
}

func (env *Env) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" || len(req.Password) < 6 {
		respondError(w, http.StatusBadRequest, "Email and password (min 6 chars) are required")
		return
	}

	if req.Role == "" {
		req.Role = models.RoleConsumer
	}

	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	user := models.User{
		Email:        req.Email,
		PasswordHash: hash,
		Name:         req.Name,
		Role:         req.Role,
		IsAnonymous:  false,
	}

	if err := env.DB.Create(&user).Error; err != nil {
		respondError(w, http.StatusConflict, "User with this email already exists")
		return
	}

	metrics.UsersRegisteredTotal.WithLabelValues(string(user.Role)).Inc()

	token, err := auth.GenerateAuthToken(&user, env.Config.JWTSecret)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	respondJSON(w, http.StatusCreated, AuthResponse{
		Token: token,
		User:  &user,
	})
}

func (env *Env) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	var user models.User
	if err := env.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid email or password")
		return
	}

	if !auth.CheckPassword(req.Password, user.PasswordHash) {
		respondError(w, http.StatusUnauthorized, "Invalid email or password")
		return
	}

	token, err := auth.GenerateAuthToken(&user, env.Config.JWTSecret)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	respondJSON(w, http.StatusOK, AuthResponse{
		Token: token,
		User:  &user,
	})
}

// GuestLogin creates or retrieves an anonymous consumer wallet account instantaneously
func (env *Env) GuestLogin(w http.ResponseWriter, r *http.Request) {
	anonID := uuid.New().String()
	email := fmt.Sprintf("guest_%s@alpacard.local", anonID[:8])
	dummyHash, _ := auth.HashPassword(uuid.New().String())

	user := models.User{
		Email:        email,
		PasswordHash: dummyHash,
		Name:         "Loyalty Customer",
		Role:         models.RoleConsumer,
		IsAnonymous:  true,
	}

	if err := env.DB.Create(&user).Error; err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to initialize guest wallet")
		return
	}

	metrics.UsersRegisteredTotal.WithLabelValues("guest").Inc()

	token, err := auth.GenerateAuthToken(&user, env.Config.JWTSecret)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	respondJSON(w, http.StatusCreated, AuthResponse{
		Token: token,
		User:  &user,
	})
}

func (env *Env) Me(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var user models.User
	if err := env.DB.Preload("OwnedBusinesses").Preload("StaffAt").First(&user, "id = ?", claims.UserID).Error; err != nil {
		respondError(w, http.StatusNotFound, "User not found")
		return
	}

	respondJSON(w, http.StatusOK, user)
}

type LinkGuestRequest struct {
	GuestToken string `json:"guestToken"`
}

func (env *Env) LinkGuestCards(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req LinkGuestRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	req.GuestToken = strings.TrimSpace(req.GuestToken)
	if req.GuestToken == "" {
		respondJSON(w, http.StatusOK, map[string]interface{}{"success": true, "linked": 0})
		return
	}

	guestClaims, err := auth.VerifyAuthToken(req.GuestToken, env.Config.JWTSecret)
	if err != nil {
		respondJSON(w, http.StatusOK, map[string]interface{}{"success": false, "linked": 0, "error": "Invalid guest token"})
		return
	}

	if guestClaims.UserID == claims.UserID {
		respondJSON(w, http.StatusOK, map[string]interface{}{"success": true, "linked": 0})
		return
	}

	var guestCards []models.Card
	if err := env.DB.Where("user_id = ?", guestClaims.UserID).Find(&guestCards).Error; err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to query guest cards")
		return
	}

	linkedCount := 0
	for _, gCard := range guestCards {
		var existingCard models.Card
		err := env.DB.Where("user_id = ? AND campaign_id = ?", claims.UserID, gCard.CampaignID).First(&existingCard).Error
		if err != nil {
			// User does not have this card yet: transfer ownership
			gCard.UserID = claims.UserID
			env.DB.Save(&gCard)
			linkedCount++
		} else {
			// User already holds this card: merge stamps if guest had stamps
			if gCard.Stamps > 0 {
				existingCard.Stamps += gCard.Stamps
				env.DB.Save(&existingCard)
			}
			// Delete duplicate guest card
			env.DB.Delete(&gCard)
			linkedCount++
		}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"linked":  linkedCount,
	})
}
