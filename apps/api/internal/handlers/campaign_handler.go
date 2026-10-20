package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/gabmetal/alpacard/api/internal/auth"
	"github.com/gabmetal/alpacard/api/internal/models"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type CreateCampaignRequest struct {
	BusinessID     string `json:"businessId"`
	Name           string `json:"name"`
	Description    string `json:"description"`
	StampsRequired int    `json:"stampsRequired"`
	Reward         string `json:"reward"`
	LogoURL        string `json:"logoUrl"`
}

func (env *Env) CreateCampaign(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req CreateCampaignRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" || req.StampsRequired <= 0 {
		respondError(w, http.StatusBadRequest, "Campaign name and positive stamps required")
		return
	}

	businessID, err := uuid.Parse(req.BusinessID)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid business ID")
		return
	}

	// Verify owner owns this business
	var business models.Business
	if err := env.DB.First(&business, "id = ? AND owner_id = ?", businessID, claims.UserID).Error; err != nil {
		respondError(w, http.StatusForbidden, "You do not own this business")
		return
	}

	campaign := models.Campaign{
		BusinessID:     businessID,
		Name:           req.Name,
		Description:    req.Description,
		StampsRequired: req.StampsRequired,
		Reward:         req.Reward,
		LogoURL:        req.LogoURL,
		IsActive:       true,
	}

	if err := env.DB.Create(&campaign).Error; err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create campaign")
		return
	}

	respondJSON(w, http.StatusCreated, campaign)
}

func (env *Env) ListCampaigns(w http.ResponseWriter, r *http.Request) {
	businessIDStr := r.URL.Query().Get("businessId")
	if businessIDStr == "" {
		respondError(w, http.StatusBadRequest, "businessId query parameter is required")
		return
	}

	businessID, err := uuid.Parse(businessIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid business ID")
		return
	}

	var campaigns []models.Campaign
	if err := env.DB.Where("business_id = ?", businessID).Order("created_at desc").Find(&campaigns).Error; err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch campaigns")
		return
	}

	// Attach card counts
	for i := range campaigns {
		var count int64
		env.DB.Model(&models.Card{}).Where("campaign_id = ?", campaigns[i].ID).Count(&count)
		campaigns[i].CardsCount = count
	}

	respondJSON(w, http.StatusOK, campaigns)
}

func (env *Env) GetCampaign(w http.ResponseWriter, r *http.Request) {
	campaignIDStr := chi.URLParam(r, "id")
	campaignID, err := uuid.Parse(campaignIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid campaign ID")
		return
	}

	var campaign models.Campaign
	if err := env.DB.Preload("Business").First(&campaign, "id = ?", campaignID).Error; err != nil {
		respondError(w, http.StatusNotFound, "Campaign not found")
		return
	}

	var count int64
	env.DB.Model(&models.Card{}).Where("campaign_id = ?", campaign.ID).Count(&count)
	campaign.CardsCount = count

	claimURL := fmt.Sprintf("%s/claim/%s", env.Config.AppURL, campaign.ID)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"campaign": campaign,
		"claimUrl": claimURL,
	})
}
