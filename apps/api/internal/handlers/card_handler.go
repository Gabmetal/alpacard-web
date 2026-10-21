package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gabmetal/alpacard/api/internal/auth"
	"github.com/gabmetal/alpacard/api/internal/metrics"
	"github.com/gabmetal/alpacard/api/internal/models"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type CardSSEEvent struct {
	CardID string `json:"cardId"`
	Stamps int    `json:"stamps"`
	Action string `json:"action"`
}

var (
	cardSubsMu sync.RWMutex
	cardSubs   = make(map[uuid.UUID]map[chan CardSSEEvent]struct{})
)

// NotifyCardUpdate broadcasts a real-time stamp/redeem update to any open SSE streams for this card
func NotifyCardUpdate(cardID uuid.UUID, stamps int, action string) {
	cardSubsMu.RLock()
	defer cardSubsMu.RUnlock()

	subs, ok := cardSubs[cardID]
	if !ok {
		return
	}
	evt := CardSSEEvent{
		CardID: cardID.String(),
		Stamps: stamps,
		Action: action,
	}
	for ch := range subs {
		select {
		case ch <- evt:
		default:
		}
	}
}

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

	metrics.CardsClaimedTotal.Inc()

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
	if err := env.DB.Preload("Campaign.Business").First(&card, "id = ? AND user_id = ?", cardID, claims.UserID).Error; err != nil {
		respondError(w, http.StatusNotFound, "Card not found")
		return
	}

	tokenStr, jti, err := auth.GenerateStampQRToken(&card, env.Config.JWTSecret)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to generate stamp token")
		return
	}

	metrics.QRTokensGeneratedTotal.Inc()

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

// StreamCardEvents provides a persistent Server-Sent Events (SSE) stream so the customer's
// punch card updates in real time when a stamp is added, without polling /qr in a loop.
func (env *Env) StreamCardEvents(w http.ResponseWriter, r *http.Request) {
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
	if err := env.DB.First(&card, "id = ? AND user_id = ?", cardID, claims.UserID).Error; err != nil {
		respondError(w, http.StatusNotFound, "Card not found")
		return
	}

	flusher, ok := w.(http.Flusher)
	if !ok {
		respondError(w, http.StatusInternalServerError, "Streaming unsupported")
		return
	}

	// Disable write deadline for this long-lived SSE connection
	rc := http.NewResponseController(w)
	_ = rc.SetWriteDeadline(time.Time{})

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache, no-transform")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")
	w.WriteHeader(http.StatusOK)

	metrics.SSESubscribers.Inc()
	defer metrics.SSESubscribers.Dec()

	_, _ = fmt.Fprintf(w, ": connected\n\n")
	flusher.Flush()

	ch := make(chan CardSSEEvent, 4)
	cardSubsMu.Lock()
	if cardSubs[cardID] == nil {
		cardSubs[cardID] = make(map[chan CardSSEEvent]struct{})
	}
	cardSubs[cardID][ch] = struct{}{}
	cardSubsMu.Unlock()

	defer func() {
		cardSubsMu.Lock()
		if subs, exists := cardSubs[cardID]; exists {
			delete(subs, ch)
			if len(subs) == 0 {
				delete(cardSubs, cardID)
			}
		}
		cardSubsMu.Unlock()
	}()

	lastStamps := card.Stamps
	heartbeat := time.NewTicker(15 * time.Second)
	defer heartbeat.Stop()

	dbCheck := time.NewTicker(4 * time.Second)
	defer dbCheck.Stop()

	for {
		select {
		case <-r.Context().Done():
			return
		case evt := <-ch:
			lastStamps = evt.Stamps
			payload, _ := json.Marshal(evt)
			_, _ = fmt.Fprintf(w, "data: %s\n\n", payload)
			flusher.Flush()
		case <-dbCheck.C:
			var current models.Card
			if err := env.DB.Select("stamps").First(&current, "id = ?", cardID).Error; err == nil {
				if current.Stamps != lastStamps {
					action := "EARN"
					if current.Stamps < lastStamps {
						action = "REDEEM"
					}
					lastStamps = current.Stamps
					payload, _ := json.Marshal(CardSSEEvent{
						CardID: cardID.String(),
						Stamps: current.Stamps,
						Action: action,
					})
					_, _ = fmt.Fprintf(w, "data: %s\n\n", payload)
					flusher.Flush()
				}
			}
		case <-heartbeat.C:
			_, _ = fmt.Fprintf(w, ": ping\n\n")
			flusher.Flush()
		}
	}
}
