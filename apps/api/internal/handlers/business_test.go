package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gabmetal/alpacard/api/internal/models"
	"github.com/go-chi/chi/v5"
)

func TestCreateAndUpdateBusiness(t *testing.T) {
	_, env, owner, _ := setupTestDB(t)

	// 1. Create Business with brand color and category
	createPayload := CreateBusinessRequest{
		Name:        "Artisan Bakery",
		LogoURL:     "/api/uploads/bakery-logo.png",
		BrandColor:  "#e11d48",
		Description: "Fresh pastries and sourdough daily",
		Category:    "Bakery",
		Website:     "https://artisanbakery.com",
		Instagram:   "@artisanbakery",
	}
	body, _ := json.Marshal(createPayload)

	req := httptest.NewRequest("POST", "/api/v1/businesses", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req = withAuth(req, owner)

	rr := httptest.NewRecorder()
	env.CreateBusiness(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("Expected status 201 Created, got %d: %s", rr.Code, rr.Body.String())
	}

	var created models.Business
	if err := json.Unmarshal(rr.Body.Bytes(), &created); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if created.Name != "Artisan Bakery" || created.BrandColor != "#e11d48" || created.Category != "Bakery" {
		t.Errorf("Unexpected created business fields: %+v", created)
	}

	// 2. Update Business (change name, color, instagram)
	newName := "Artisan Bakery & Cafe"
	newColor := "#059669"
	newInstagram := "@artisanbakerycafe"
	updatePayload := UpdateBusinessRequest{
		Name:       &newName,
		BrandColor: &newColor,
		Instagram:  &newInstagram,
	}
	upBody, _ := json.Marshal(updatePayload)

	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("businessId", created.ID.String())

	upReq := httptest.NewRequest("PUT", "/api/v1/businesses/"+created.ID.String(), bytes.NewBuffer(upBody))
	upReq.Header.Set("Content-Type", "application/json")
	upReq = upReq.WithContext(context.WithValue(upReq.Context(), chi.RouteCtxKey, rctx))
	upReq = withAuth(upReq, owner)

	upRr := httptest.NewRecorder()
	env.UpdateBusiness(upRr, upReq)

	if upRr.Code != http.StatusOK {
		t.Fatalf("Expected status 200 OK, got %d: %s", upRr.Code, upRr.Body.String())
	}

	var updated models.Business
	if err := json.Unmarshal(upRr.Body.Bytes(), &updated); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if updated.Name != "Artisan Bakery & Cafe" || updated.BrandColor != "#059669" || updated.Instagram != "@artisanbakerycafe" {
		t.Errorf("Unexpected updated business fields: %+v", updated)
	}
}
