package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gabmetal/alpacard/api/internal/auth"
	"github.com/gabmetal/alpacard/api/internal/email"
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

	verificationToken := uuid.New().String()
	verificationExp := time.Now().Add(24 * time.Hour)

	user := models.User{
		Email:                 req.Email,
		PasswordHash:          hash,
		Name:                  req.Name,
		Role:                  req.Role,
		IsAnonymous:           false,
		EmailVerified:         false,
		VerificationToken:     verificationToken,
		VerificationExpiresAt: &verificationExp,
	}

	if err := env.DB.Create(&user).Error; err != nil {
		respondError(w, http.StatusConflict, "User with this email already exists")
		return
	}

	metrics.UsersRegisteredTotal.WithLabelValues(string(user.Role)).Inc()

	// Dispatch asynchronous welcome/verification email
	go func() {
		_ = email.SendVerificationEmail(env.Config, user.Email, user.Name, verificationToken)
	}()

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
		Email:         email,
		PasswordHash:  dummyHash,
		Name:          "Loyalty Customer",
		Role:          models.RoleConsumer,
		IsAnonymous:   true,
		EmailVerified: true,
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

// VerifyEmail confirms account ownership via unique verification token
func (env *Env) VerifyEmail(w http.ResponseWriter, r *http.Request) {
	token := strings.TrimSpace(r.URL.Query().Get("token"))
	if token == "" {
		respondError(w, http.StatusBadRequest, "Verification token is required")
		return
	}

	var user models.User
	if err := env.DB.Where("verification_token = ?", token).First(&user).Error; err != nil {
		respondError(w, http.StatusBadRequest, "Invalid or already used verification token")
		return
	}

	if user.VerificationExpiresAt != nil && time.Now().After(*user.VerificationExpiresAt) {
		respondError(w, http.StatusBadRequest, "Verification token has expired")
		return
	}

	user.EmailVerified = true
	user.VerificationToken = ""
	user.VerificationExpiresAt = nil
	if err := env.DB.Save(&user).Error; err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to verify email")
		return
	}

	// If browser HTML request, redirect with query param
	accept := r.Header.Get("Accept")
	if strings.Contains(accept, "text/html") {
		redirectPath := "/login?verified=true"
		if user.Role == models.RoleConsumer {
			redirectPath = "/wallet?verified=true"
		}
		http.Redirect(w, r, redirectPath, http.StatusSeeOther)
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Email verified successfully",
		"user":    user,
	})
}

// ResendVerificationEmail dispatches a fresh verification token to an unverified user
func (env *Env) ResendVerificationEmail(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email string `json:"email"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	var user models.User
	if req.Email != "" {
		if err := env.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
			// Don't leak user existence
			respondJSON(w, http.StatusOK, map[string]interface{}{
				"success": true,
				"message": "If an unverified account exists with that email, a verification link has been sent.",
			})
			return
		}
	} else if claims, ok := auth.GetUserFromContext(r.Context()); ok {
		if err := env.DB.First(&user, "id = ?", claims.UserID).Error; err != nil {
			respondError(w, http.StatusNotFound, "User not found")
			return
		}
	} else {
		respondError(w, http.StatusBadRequest, "Email or authorization is required")
		return
	}

	if user.EmailVerified {
		respondJSON(w, http.StatusOK, map[string]interface{}{
			"success": true,
			"message": "Email is already verified",
		})
		return
	}

	token := uuid.New().String()
	exp := time.Now().Add(24 * time.Hour)
	user.VerificationToken = token
	user.VerificationExpiresAt = &exp
	_ = env.DB.Save(&user)

	go func() {
		_ = email.SendVerificationEmail(env.Config, user.Email, user.Name, token)
	}()

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Verification email sent",
	})
}

type UpdateProfileRequest struct {
	Name string `json:"name"`
}

// UpdateProfile allows a user to update their personal information
func (env *Env) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	name := strings.TrimSpace(req.Name)
	if name == "" {
		respondError(w, http.StatusBadRequest, "Name cannot be empty")
		return
	}

	var user models.User
	if err := env.DB.First(&user, "id = ?", claims.UserID).Error; err != nil {
		respondError(w, http.StatusNotFound, "User not found")
		return
	}

	user.Name = name
	if err := env.DB.Save(&user).Error; err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to update profile")
		return
	}

	respondJSON(w, http.StatusOK, user)
}

// DeleteAccount allows a user to autonomously delete their account and associated data
func (env *Env) DeleteAccount(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var user models.User
	if err := env.DB.First(&user, "id = ?", claims.UserID).Error; err != nil {
		respondError(w, http.StatusNotFound, "User not found")
		return
	}

	// Delete user's loyalty cards
	env.DB.Where("user_id = ?", user.ID).Delete(&models.Card{})
	// Clean up business staff memberships
	env.DB.Exec("DELETE FROM business_staff WHERE user_id = ?", user.ID)
	// Delete user
	if err := env.DB.Delete(&user).Error; err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to delete account")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Account successfully deleted",
	})
}
