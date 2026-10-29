package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gabmetal/alpacard/api/internal/auth"
	"github.com/gabmetal/alpacard/api/internal/models"
)

func TestLinkGuestCards(t *testing.T) {
	db, env, _, business := setupTestDB(t)

	// Create campaign
	campaign := &models.Campaign{
		BusinessID:     business.ID,
		Name:           "Coffee Rewards",
		StampsRequired: 10,
		IsActive:       true,
	}
	db.Create(campaign)

	// Create anonymous guest
	guest := &models.User{
		Email:       "guest_1234@guest.alpacard",
		Name:        "Guest Customer",
		Role:        models.RoleConsumer,
		IsAnonymous: true,
	}
	db.Create(guest)
	guestToken, err := auth.GenerateAuthToken(guest, env.Config.JWTSecret)
	if err != nil {
		t.Fatalf("Failed to generate guest token: %v", err)
	}

	// Issue card to guest with 4 stamps
	guestCard := &models.Card{
		CampaignID: campaign.ID,
		UserID:     guest.ID,
		Stamps:     4,
	}
	db.Create(guestCard)

	// Create registered consumer
	registeredUser := &models.User{
		Email:       "consumer@example.com",
		Name:        "Alice Consumer",
		Role:        models.RoleConsumer,
		IsAnonymous: false,
	}
	db.Create(registeredUser)

	// Call link-guest
	payload := LinkGuestRequest{GuestToken: guestToken}
	body, _ := json.Marshal(payload)
	req := httptest.NewRequest("POST", "/api/v1/auth/link-guest", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req = withAuth(req, registeredUser)

	rr := httptest.NewRecorder()
	env.LinkGuestCards(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("Expected status 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var res map[string]interface{}
	_ = json.Unmarshal(rr.Body.Bytes(), &res)
	if res["linked"].(float64) != 1 {
		t.Fatalf("Expected 1 linked card, got %v", res["linked"])
	}

	// Verify card now belongs to registeredUser
	var updatedCard models.Card
	if err := db.First(&updatedCard, "campaign_id = ? AND user_id = ?", campaign.ID, registeredUser.ID).Error; err != nil {
		t.Fatalf("Card was not transferred to registered user: %v", err)
	}
	if updatedCard.Stamps != 4 {
		t.Fatalf("Expected 4 stamps, got %d", updatedCard.Stamps)
	}
}

func TestRegisterAndVerifyEmail(t *testing.T) {
	db, env, _, _ := setupTestDB(t)

	// 1. Register a new user
	registerPayload := RegisterRequest{
		Email:    "testverify@example.com",
		Password: "password123",
		Name:     "Test User",
		Role:     models.RoleConsumer,
	}
	body, _ := json.Marshal(registerPayload)
	req := httptest.NewRequest("POST", "/api/v1/auth/register", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	env.Register(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("Expected status 201, got %d: %s", rr.Code, rr.Body.String())
	}

	var user models.User
	if err := db.Where("email = ?", "testverify@example.com").First(&user).Error; err != nil {
		t.Fatalf("User not found: %v", err)
	}
	if user.EmailVerified {
		t.Fatalf("Expected user email to be unverified initially")
	}
	if user.VerificationToken == "" {
		t.Fatalf("Expected verification token to be set")
	}

	// 2. Call VerifyEmail with the token
	verifyReq := httptest.NewRequest("GET", "/api/v1/auth/verify-email?token="+user.VerificationToken, nil)
	verifyRR := httptest.NewRecorder()
	env.VerifyEmail(verifyRR, verifyReq)

	if verifyRR.Code != http.StatusOK {
		t.Fatalf("Expected status 200, got %d: %s", verifyRR.Code, verifyRR.Body.String())
	}

	// 3. Verify user in DB is now verified
	db.First(&user, "id = ?", user.ID)
	if !user.EmailVerified {
		t.Fatalf("Expected user email to be verified after calling VerifyEmail")
	}
	if user.VerificationToken != "" {
		t.Fatalf("Expected verification token to be cleared")
	}
}

func TestUpdateProfile(t *testing.T) {
	db, env, _, _ := setupTestDB(t)

	user := &models.User{
		Email: "profiletest@example.com",
		Name:  "Original Name",
		Role:  models.RoleConsumer,
	}
	db.Create(user)

	payload := UpdateProfileRequest{Name: "Updated Name"}
	body, _ := json.Marshal(payload)
	req := httptest.NewRequest("PUT", "/api/v1/auth/profile", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req = withAuth(req, user)

	rr := httptest.NewRecorder()
	env.UpdateProfile(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("Expected status 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var updatedUser models.User
	db.First(&updatedUser, "id = ?", user.ID)
	if updatedUser.Name != "Updated Name" {
		t.Fatalf("Expected name 'Updated Name', got '%s'", updatedUser.Name)
	}
}

func TestDeleteAccount(t *testing.T) {
	db, env, _, business := setupTestDB(t)

	user := &models.User{
		Email: "deleteme@example.com",
		Name:  "Delete Me",
		Role:  models.RoleConsumer,
	}
	db.Create(user)

	campaign := &models.Campaign{
		BusinessID: business.ID,
		Name:       "Test Campaign",
	}
	db.Create(campaign)

	card := &models.Card{
		CampaignID: campaign.ID,
		UserID:     user.ID,
		Stamps:     2,
	}
	db.Create(card)

	req := httptest.NewRequest("DELETE", "/api/v1/auth/account", nil)
	req = withAuth(req, user)
	rr := httptest.NewRecorder()
	env.DeleteAccount(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("Expected status 200, got %d: %s", rr.Code, rr.Body.String())
	}

	// Verify user is deleted
	var deletedUser models.User
	if err := db.First(&deletedUser, "id = ?", user.ID).Error; err == nil {
		t.Fatalf("User was not deleted from database")
	}

	// Verify card is deleted
	var deletedCard models.Card
	if err := db.First(&deletedCard, "id = ?", card.ID).Error; err == nil {
		t.Fatalf("Card was not deleted when account was deleted")
	}

	// Verify that the email is released and can be re-registered
	regPayload := map[string]string{
		"email":    "deleteme@example.com",
		"password": "Password123!",
		"name":     "Recreated User",
		"role":     "CONSUMER",
	}
	body, _ := json.Marshal(regPayload)
	regReq := httptest.NewRequest("POST", "/api/v1/auth/register", bytes.NewBuffer(body))
	regReq.Header.Set("Content-Type", "application/json")
	regRr := httptest.NewRecorder()
	env.Register(regRr, regReq)

	if regRr.Code != http.StatusCreated {
		t.Fatalf("Expected status 201 on re-registration with same email, got %d: %s", regRr.Code, regRr.Body.String())
	}
}

func TestForgotPasswordAndReset(t *testing.T) {
	db, env, _, _ := setupTestDB(t)

	// Create user
	hash, _ := auth.HashPassword("oldpassword123")
	user := &models.User{
		Email:        "recovery@example.com",
		PasswordHash: hash,
		Name:         "Recovery Tester",
		Role:         models.RoleOwner,
	}
	db.Create(user)

	// 1. Request password reset
	forgotBody, _ := json.Marshal(map[string]string{
		"email": "recovery@example.com",
	})
	forgotReq := httptest.NewRequest("POST", "/api/v1/auth/forgot-password", bytes.NewBuffer(forgotBody))
	forgotRR := httptest.NewRecorder()
	env.ForgotPassword(forgotRR, forgotReq)

	if forgotRR.Code != http.StatusOK {
		t.Fatalf("Expected 200 for forgot password, got %d: %s", forgotRR.Code, forgotRR.Body.String())
	}

	// Fetch reset token from DB
	var updatedUser models.User
	db.First(&updatedUser, "id = ?", user.ID)
	if updatedUser.ResetPasswordToken == "" {
		t.Fatalf("Expected ResetPasswordToken to be set in DB")
	}

	// 2. Perform password reset
	resetBody, _ := json.Marshal(map[string]string{
		"token":    updatedUser.ResetPasswordToken,
		"password": "brandnewpassword456",
	})
	resetReq := httptest.NewRequest("POST", "/api/v1/auth/reset-password", bytes.NewBuffer(resetBody))
	resetRR := httptest.NewRecorder()
	env.ResetPassword(resetRR, resetReq)

	if resetRR.Code != http.StatusOK {
		t.Fatalf("Expected 200 for reset password, got %d: %s", resetRR.Code, resetRR.Body.String())
	}

	// 3. Verify user can log in with new password
	db.First(&updatedUser, "id = ?", user.ID)
	if !auth.CheckPassword("brandnewpassword456", updatedUser.PasswordHash) {
		t.Fatalf("New password hash check failed")
	}
	if updatedUser.ResetPasswordToken != "" {
		t.Fatalf("ResetPasswordToken should be cleared after reset")
	}
}

func TestChangePassword(t *testing.T) {
	db, env, _, _ := setupTestDB(t)

	hash, _ := auth.HashPassword("currentpass123")
	user := &models.User{
		Email:        "changepass@example.com",
		PasswordHash: hash,
		Name:         "Password Changer",
		Role:         models.RoleOwner,
	}
	db.Create(user)

	// 1. Invalid current password
	badBody, _ := json.Marshal(map[string]string{
		"currentPassword": "wrongpass",
		"newPassword":     "newsecretpass789",
	})
	badReq := withAuth(httptest.NewRequest("POST", "/api/v1/auth/change-password", bytes.NewBuffer(badBody)), user)
	badRR := httptest.NewRecorder()
	env.ChangePassword(badRR, badReq)

	if badRR.Code != http.StatusUnauthorized {
		t.Fatalf("Expected 401 for wrong current password, got %d: %s", badRR.Code, badRR.Body.String())
	}

	// 2. Valid password change
	goodBody, _ := json.Marshal(map[string]string{
		"currentPassword": "currentpass123",
		"newPassword":     "newsecretpass789",
	})
	goodReq := withAuth(httptest.NewRequest("POST", "/api/v1/auth/change-password", bytes.NewBuffer(goodBody)), user)
	goodRR := httptest.NewRecorder()
	env.ChangePassword(goodRR, goodReq)

	if goodRR.Code != http.StatusOK {
		t.Fatalf("Expected 200 for valid change password, got %d: %s", goodRR.Code, goodRR.Body.String())
	}

	var updatedUser models.User
	db.First(&updatedUser, "id = ?", user.ID)
	if !auth.CheckPassword("newsecretpass789", updatedUser.PasswordHash) {
		t.Fatalf("Password was not updated in DB")
	}
}
