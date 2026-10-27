package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gabmetal/alpacard/api/internal/auth"
	"github.com/gabmetal/alpacard/api/internal/config"
	"github.com/gabmetal/alpacard/api/internal/models"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func setupTestDB(t *testing.T) (*gorm.DB, *Env, *models.User, *models.Business) {
	db, err := gorm.Open(sqlite.Open("file:"+uuid.New().String()+"?mode=memory&cache=shared"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		t.Fatalf("Failed to open sqlite memory DB: %v", err)
	}

	err = db.AutoMigrate(
		&models.User{},
		&models.Business{},
		&models.Campaign{},
		&models.Card{},
		&models.Transaction{},
		&models.ScannedToken{},
	)
	if err != nil {
		t.Fatalf("Failed to automigrate: %v", err)
	}

	env := &Env{
		DB: db,
		Config: &config.Config{
			AppURL: "http://localhost:4000",
		},
	}

	owner := &models.User{
		Email: "owner@test.com",
		Name:  "Test Owner",
		Role:  models.RoleOwner,
	}
	db.Create(owner)

	business := &models.Business{
		Name:    "Test Coffee Roasters",
		Slug:    "test-coffee",
		OwnerID: owner.ID,
	}
	db.Create(business)

	return db, env, owner, business
}

func withAuth(req *http.Request, user *models.User) *http.Request {
	claims := &auth.AuthClaims{
		UserID: user.ID,
		Email:  user.Email,
		Role:   user.Role,
	}
	ctx := context.WithValue(req.Context(), auth.UserContextKey, claims)
	return req.WithContext(ctx)
}

func TestCreateAndCustomizeCampaign(t *testing.T) {
	_, env, owner, business := setupTestDB(t)

	payload := CreateCampaignRequest{
		BusinessID:     business.ID.String(),
		Name:           "Artisan Espresso Club",
		Description:    "Buy 9 get 10th free",
		StampsRequired: 9,
		Reward:         "Free Cappuccino",
		LogoURL:        "/api/uploads/logo.png",
		BgType:         "preset",
		BgValue:        "espresso",
		TextColor:      "#ffffff",
		StampIcon:      "coffee",
	}

	body, _ := json.Marshal(payload)
	req := httptest.NewRequest("POST", "/api/v1/campaigns", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req = withAuth(req, owner)

	rr := httptest.NewRecorder()
	env.CreateCampaign(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("Expected status 201 Created, got %d: %s", rr.Code, rr.Body.String())
	}

	var created models.Campaign
	if err := json.Unmarshal(rr.Body.Bytes(), &created); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if created.BgValue != "espresso" || created.StampIcon != "coffee" || created.LogoURL != "/api/uploads/logo.png" {
		t.Errorf("Unexpected campaign personalization fields: %+v", created)
	}

	// Now test updating the campaign design
	newBgValue := "sunset"
	newStampIcon := "star"
	updatePayload := UpdateCampaignRequest{
		BgValue:   &newBgValue,
		StampIcon: &newStampIcon,
	}
	upBody, _ := json.Marshal(updatePayload)

	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", created.ID.String())

	upReq := httptest.NewRequest("PUT", "/api/v1/campaigns/"+created.ID.String(), bytes.NewBuffer(upBody))
	upReq.Header.Set("Content-Type", "application/json")
	upReq = upReq.WithContext(context.WithValue(upReq.Context(), chi.RouteCtxKey, rctx))
	upReq = withAuth(upReq, owner)

	upRr := httptest.NewRecorder()
	env.UpdateCampaign(upRr, upReq)

	if upRr.Code != http.StatusOK {
		t.Fatalf("Expected status 200 OK, got %d: %s", upRr.Code, upRr.Body.String())
	}

	var updated models.Campaign
	if err := json.Unmarshal(upRr.Body.Bytes(), &updated); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if updated.BgValue != "sunset" || updated.StampIcon != "star" {
		t.Errorf("Campaign update did not apply correctly: %+v", updated)
	}

	// Test deleting the campaign
	delReq := httptest.NewRequest("DELETE", "/api/v1/campaigns/"+created.ID.String(), nil)
	delReq = delReq.WithContext(context.WithValue(delReq.Context(), chi.RouteCtxKey, rctx))
	delReq = withAuth(delReq, owner)

	delRr := httptest.NewRecorder()
	env.DeleteCampaign(delRr, delReq)

	if delRr.Code != http.StatusOK {
		t.Fatalf("Expected status 200 OK on delete, got %d: %s", delRr.Code, delRr.Body.String())
	}

	// Verify it's no longer found
	var check models.Campaign
	if err := env.DB.First(&check, "id = ?", created.ID).Error; err == nil {
		t.Errorf("Expected campaign to be soft-deleted, but still found in DB")
	}
}

func TestGetCardQRPreloadsBusiness(t *testing.T) {
	db, env, _, business := setupTestDB(t)

	// Create consumer
	consumer := &models.User{
		Email: "consumer@test.com",
		Name:  "Test Consumer",
		Role:  models.RoleConsumer,
	}
	db.Create(consumer)

	// Create campaign
	campaign := &models.Campaign{
		BusinessID:     business.ID,
		Name:           "Cafecito",
		StampsRequired: 3,
		Reward:         "Café gratis",
		IsActive:       true,
	}
	db.Create(campaign)

	// Issue card
	card := &models.Card{
		CampaignID: campaign.ID,
		UserID:     consumer.ID,
		Stamps:     1,
	}
	db.Create(card)

	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", card.ID.String())

	req := httptest.NewRequest("GET", "/api/v1/cards/"+card.ID.String()+"/qr", nil)
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
	req = withAuth(req, consumer)

	rr := httptest.NewRecorder()
	env.GetCardQRToken(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("Expected status 200 OK, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp struct {
		Card struct {
			Campaign struct {
				Business struct {
					Name string `json:"name"`
				} `json:"business"`
			} `json:"campaign"`
		} `json:"card"`
		ScanURL string `json:"scanUrl"`
	}

	if err := json.Unmarshal(rr.Body.Bytes(), &resp); err != nil {
		t.Fatalf("Failed to decode QR response: %v", err)
	}

	if resp.Card.Campaign.Business.Name != "Test Coffee Roasters" {
		t.Errorf("Expected Business Name 'Test Coffee Roasters', got '%s'", resp.Card.Campaign.Business.Name)
	}
}
