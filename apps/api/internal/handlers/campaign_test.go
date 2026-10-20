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
}
