package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/gabmetal/alpacard/api/internal/auth"
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
