package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gabmetal/alpacard/api/internal/auth"
	"github.com/gabmetal/alpacard/api/internal/models"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type ClaimCardRequest struct {
	CampaignID string `json:"campaignId"`
}

func (env *Env) ClaimCard(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req ClaimCardRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	campaignID, err := uuid.Parse(req.CampaignID)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid campaign ID")
		return
	}

	var campaign models.Campaign
	if err := env.DB.First(&campaign, "id = ? AND is_active = ?", campaignID, true).Error; err != nil {
		respondError(w, http.StatusNotFound, "Campaign not found or inactive")
		return
	}

	// Check if user already holds this card
	var existingCard models.Card
	if err := env.DB.Preload("Campaign.Business").Where("user_id = ? AND campaign_id = ?", claims.UserID, campaignID).First(&existingCard).Error; err == nil {
		respondJSON(w, http.StatusOK, existingCard)
		return
	}

	// Create new Card
	newCard := models.Card{
		CampaignID: campaignID,
		UserID:     claims.UserID,
		Stamps:     0,
	}

	if err := env.DB.Create(&newCard).Error; err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to issue card")
		return
	}

	_ = env.DB.Preload("Campaign.Business").First(&newCard, "id = ?", newCard.ID)

	respondJSON(w, http.StatusCreated, newCard)
}

func (env *Env) GetMyCards(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var cards []models.Card
	if err := env.DB.Preload("Campaign.Business").Where("user_id = ?", claims.UserID).Order("updated_at desc").Find(&cards).Error; err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to retrieve cards")
		return
	}

	respondJSON(w, http.StatusOK, cards)
}

func (env *Env) GetCardDetail(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	cardIDStr := chi.URLParam(r, "id")
	cardID, err := uuid.Parse(cardIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid card ID")
		return
	}

	var card models.Card
	if err := env.DB.Preload("Campaign.Business").First(&card, "id = ? AND user_id = ?", cardID, claims.UserID).Error; err != nil {
		respondError(w, http.StatusNotFound, "Card not found in your wallet")
		return
	}

	respondJSON(w, http.StatusOK, card)
}

func (env *Env) GetCardQRToken(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	cardIDStr := chi.URLParam(r, "id")
	cardID, err := uuid.Parse(cardIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid card ID")
		return
	}

	var card models.Card
	if err := env.DB.Preload("Campaign").First(&card, "id = ? AND user_id = ?", cardID, claims.UserID).Error; err != nil {
		respondError(w, http.StatusNotFound, "Card not found")
		return
	}

	tokenStr, jti, err := auth.GenerateStampQRToken(&card, env.Config.JWTSecret)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to generate stamp token")
		return
	}

	scanURL := fmt.Sprintf("%s/scanner?token=%s", env.Config.AppURL, tokenStr)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"token":     tokenStr,
		"jti":       jti,
		"expiresIn": 300, // 5 minutes
		"scanUrl":   scanURL,
		"card":      card,
		"timestamp": time.Now().Unix(),
	})
}
