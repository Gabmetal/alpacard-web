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
