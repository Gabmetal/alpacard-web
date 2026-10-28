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
}
