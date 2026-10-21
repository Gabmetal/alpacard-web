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
	BgType         string `json:"bgType"`
	BgValue        string `json:"bgValue"`
	BgImageURL     string `json:"bgImageUrl"`
	TextColor      string `json:"textColor"`
	StampIcon      string `json:"stampIcon"`
}

type UpdateCampaignRequest struct {
	Name           *string `json:"name,omitempty"`
	Description    *string `json:"description,omitempty"`
	StampsRequired *int    `json:"stampsRequired,omitempty"`
	Reward         *string `json:"reward,omitempty"`
	LogoURL        *string `json:"logoUrl,omitempty"`
	BgType         *string `json:"bgType,omitempty"`
	BgValue        *string `json:"bgValue,omitempty"`
	BgImageURL     *string `json:"bgImageUrl,omitempty"`
	TextColor      *string `json:"textColor,omitempty"`
	StampIcon      *string `json:"stampIcon,omitempty"`
	IsActive       *bool   `json:"isActive,omitempty"`
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

	bgType := strings.TrimSpace(req.BgType)
	if bgType == "" {
		bgType = "preset"
	}
	bgValue := strings.TrimSpace(req.BgValue)
	if bgValue == "" {
		bgValue = "espresso"
	}
	textColor := strings.TrimSpace(req.TextColor)
	if textColor == "" {
		textColor = "#ffffff"
	}
	stampIcon := strings.TrimSpace(req.StampIcon)
	if stampIcon == "" {
		stampIcon = "coffee"
	}

	campaign := models.Campaign{
		BusinessID:     businessID,
		Name:           req.Name,
		Description:    req.Description,
		StampsRequired: req.StampsRequired,
		Reward:         req.Reward,
		LogoURL:        req.LogoURL,
		BgType:         bgType,
		BgValue:        bgValue,
		BgImageURL:     req.BgImageURL,
		TextColor:      textColor,
		StampIcon:      stampIcon,
		IsActive:       true,
	}

	if err := env.DB.Create(&campaign).Error; err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create campaign")
		return
	}

	respondJSON(w, http.StatusCreated, campaign)
}

func (env *Env) UpdateCampaign(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

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

	// Verify owner owns the business
	if campaign.Business == nil || campaign.Business.OwnerID != claims.UserID {
		respondError(w, http.StatusForbidden, "You do not have permission to modify this campaign")
		return
	}

	var req UpdateCampaignRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if req.Name != nil && strings.TrimSpace(*req.Name) != "" {
		campaign.Name = strings.TrimSpace(*req.Name)
	}
	if req.Description != nil {
		campaign.Description = strings.TrimSpace(*req.Description)
	}
	if req.StampsRequired != nil && *req.StampsRequired > 0 {
		campaign.StampsRequired = *req.StampsRequired
	}
	if req.Reward != nil {
		campaign.Reward = strings.TrimSpace(*req.Reward)
	}
	if req.LogoURL != nil {
		campaign.LogoURL = strings.TrimSpace(*req.LogoURL)
	}
	if req.BgType != nil {
		campaign.BgType = strings.TrimSpace(*req.BgType)
	}
	if req.BgValue != nil {
		campaign.BgValue = strings.TrimSpace(*req.BgValue)
	}
	if req.BgImageURL != nil {
		campaign.BgImageURL = strings.TrimSpace(*req.BgImageURL)
	}
	if req.TextColor != nil {
		campaign.TextColor = strings.TrimSpace(*req.TextColor)
	}
	if req.StampIcon != nil {
		campaign.StampIcon = strings.TrimSpace(*req.StampIcon)
	}
	if req.IsActive != nil {
		campaign.IsActive = *req.IsActive
	}

	if err := env.DB.Save(&campaign).Error; err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to update campaign")
		return
	}

	respondJSON(w, http.StatusOK, campaign)
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
