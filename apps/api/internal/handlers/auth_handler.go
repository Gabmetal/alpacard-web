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
		redirectPath := fmt.Sprintf("%s/login?verified=true", strings.TrimRight(env.Config.AppURL, "/"))
		if user.Role == models.RoleConsumer {
			redirectPath = fmt.Sprintf("%s?verified=true", strings.TrimRight(env.Config.WalletURL, "/"))
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

	// Anonymize email before soft-deletion to release the unique constraint
	// and allow re-registration with the same email in the future.
	anonymizedEmail := fmt.Sprintf("deleted_%s_%s", user.ID.String(), user.Email)
	if err := env.DB.Model(&user).Update("email", anonymizedEmail).Error; err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to anonymize account")
		return
	}

	// Delete user (soft-delete)
	if err := env.DB.Delete(&user).Error; err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to delete account")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Account successfully deleted",
	})
}

type ForgotPasswordRequest struct {
	Email string `json:"email"`
}

type ResetPasswordRequest struct {
	Token    string `json:"token"`
	Password string `json:"password"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"currentPassword"`
	NewPassword     string `json:"newPassword"`
}

// ForgotPassword initiates password recovery by emailing a secure reset link
func (env *Env) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var req ForgotPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" {
		respondError(w, http.StatusBadRequest, "Email is required")
		return
	}

	var user models.User
	if err := env.DB.Where("email = ? AND is_anonymous = false", req.Email).First(&user).Error; err == nil {
		resetToken := uuid.New().String()
		expiresAt := time.Now().Add(1 * time.Hour)

		user.ResetPasswordToken = resetToken
		user.ResetPasswordExpiresAt = &expiresAt
		if err := env.DB.Save(&user).Error; err == nil {
			baseURL := env.Config.AppURL
			if user.Role == models.RoleConsumer {
				baseURL = env.Config.WalletURL
			} else {
				if strings.Contains(baseURL, "dev.alpacard.app") {
					baseURL = "https://dev-merchant.alpacard.app"
				} else if strings.Contains(baseURL, "alpacard.app") {
					baseURL = "https://merchant.alpacard.app"
				}
			}

			resetURL := fmt.Sprintf("%s/reset-password?token=%s", strings.TrimRight(baseURL, "/"), resetToken)
			go func() {
				_ = email.SendPasswordResetEmail(env.Config, user.Email, user.Name, resetURL)
			}()
		}
	}

	respondJSON(w, http.StatusOK, map[string]string{
		"message": "If that email is registered, instructions to reset your password have been sent.",
	})
}

// ResetPassword accepts a valid reset token and sets a new password
func (env *Env) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var req ResetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	req.Token = strings.TrimSpace(req.Token)
	if req.Token == "" || len(req.Password) < 6 {
		respondError(w, http.StatusBadRequest, "Valid token and password (min 6 chars) are required")
		return
	}

	var user models.User
	if err := env.DB.Where("reset_password_token = ? AND reset_password_expires_at > ?", req.Token, time.Now()).First(&user).Error; err != nil {
		respondError(w, http.StatusBadRequest, "Invalid or expired password reset token")
		return
	}

	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	user.PasswordHash = hash
	user.ResetPasswordToken = ""
	user.ResetPasswordExpiresAt = nil
	user.EmailVerified = true

	if err := env.DB.Save(&user).Error; err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to update password")
		return
	}

	token, err := auth.GenerateAuthToken(&user, env.Config.JWTSecret)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to generate session token")
		return
	}

	respondJSON(w, http.StatusOK, AuthResponse{
		Token: token,
		User:  &user,
	})
}

// ChangePassword allows authenticated users to update their password
func (env *Env) ChangePassword(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req ChangePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if len(req.NewPassword) < 6 {
		respondError(w, http.StatusBadRequest, "New password must be at least 6 characters")
		return
	}

	var user models.User
	if err := env.DB.First(&user, "id = ?", claims.UserID).Error; err != nil {
		respondError(w, http.StatusNotFound, "User not found")
		return
	}

	if !auth.CheckPassword(req.CurrentPassword, user.PasswordHash) {
		respondError(w, http.StatusUnauthorized, "Current password is incorrect")
		return
	}

	hash, err := auth.HashPassword(req.NewPassword)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	user.PasswordHash = hash
	if err := env.DB.Save(&user).Error; err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to save new password")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{
		"message": "Password changed successfully",
	})
}
