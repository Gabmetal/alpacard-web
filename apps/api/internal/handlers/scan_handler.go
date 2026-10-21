package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gabmetal/alpacard/api/internal/auth"
	"github.com/gabmetal/alpacard/api/internal/events"
	"github.com/gabmetal/alpacard/api/internal/metrics"
	"github.com/gabmetal/alpacard/api/internal/models"
	"gorm.io/gorm"
)

type ScanRequest struct {
	Token string `json:"token"`
}

type ScanResponse struct {
	Success  bool        `json:"success"`
	Action   string      `json:"action"` // "EARN" or "REDEEM"
	Message  string      `json:"message"`
	NewCount int         `json:"newCount"`
	Card     models.Card `json:"card"`
}

func (env *Env) VerifyAndAddStamp(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		metrics.ScansTotal.WithLabelValues("unauthorized").Inc()
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req ScanRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Token == "" {
		metrics.ScansTotal.WithLabelValues("invalid_request").Inc()
		respondError(w, http.StatusBadRequest, "QR token is required")
		return
	}

	// 1. Verify Staff or Owner identity in DB
	var staffUser models.User
	if err := env.DB.Preload("OwnedBusinesses").Preload("StaffAt").First(&staffUser, "id = ?", claims.UserID).Error; err != nil {
		metrics.ScansTotal.WithLabelValues("unauthorized").Inc()
		respondError(w, http.StatusUnauthorized, "Staff user not found")
		return
	}

	if len(staffUser.OwnedBusinesses) == 0 && len(staffUser.StaffAt) == 0 {
		metrics.ScansTotal.WithLabelValues("forbidden").Inc()
		respondError(w, http.StatusForbidden, "Only business owners or registered staff can scan customer cards")
		return
	}

	// 2. Cryptographically verify the QR token
	tokenClaims, err := auth.VerifyStampQRToken(req.Token, env.Config.JWTSecret)
	if err != nil {
		metrics.ScansTotal.WithLabelValues("invalid_token").Inc()
		respondError(w, http.StatusBadRequest, "Invalid or expired QR code token")
		return
	}

	// 3. Prevent Replay Attack via JTI verification
	var existingScan models.ScannedToken
	if err := env.DB.First(&existingScan, "jti = ?", tokenClaims.ID).Error; err == nil {
		metrics.ScansTotal.WithLabelValues("replay_attack").Inc()
		respondError(w, http.StatusConflict, "This QR code has already been scanned and processed")
		return
	}

	// 4. Retrieve Card, User, and Campaign
	var card models.Card
	if err := env.DB.Preload("User").Preload("Campaign.Business").First(&card, "id = ?", tokenClaims.CardID).Error; err != nil {
		metrics.ScansTotal.WithLabelValues("not_found").Inc()
		respondError(w, http.StatusNotFound, "Loyalty card not found")
		return
	}

	// 5. Verify that the scanning staff belongs to this business
	campaignBusinessID := card.Campaign.BusinessID
	isAuthorized := false

	for _, b := range staffUser.OwnedBusinesses {
		if b.ID == campaignBusinessID {
			isAuthorized = true
			break
		}
	}
	if !isAuthorized {
		for _, b := range staffUser.StaffAt {
			if b.ID == campaignBusinessID {
				isAuthorized = true
				break
			}
		}
	}

	if !isAuthorized {
		metrics.ScansTotal.WithLabelValues("wrong_business").Inc()
		respondError(w, http.StatusForbidden, "This loyalty card belongs to a different business")
		return
	}

	// 6. Execute Atomic Transaction (Record JTI + Update Stamps + Log Transaction)
	var finalAction string
	var newStamps int
	var message string

	err = env.DB.Transaction(func(tx *gorm.DB) error {
		// Save scanned token JTI
		scannedRecord := models.ScannedToken{
			JTI:       tokenClaims.ID,
			CardID:    card.ID,
			ScannedBy: staffUser.ID,
			CreatedAt: time.Now(),
		}
		if err := tx.Create(&scannedRecord).Error; err != nil {
			return err
		}

		clientName := ""
		clientEmail := ""
		if card.User != nil {
			clientName = card.User.Name
			clientEmail = card.User.Email
		}

		if card.Stamps < card.Campaign.StampsRequired {
			// Add stamp
			finalAction = "EARN"
			newStamps = card.Stamps + 1
			message = "Stamp added successfully!"

			if err := tx.Model(&card).Update("stamps", newStamps).Error; err != nil {
				return err
			}

			txRecord := models.Transaction{
				Type:        models.TxEarn,
				Amount:      1,
				CardID:      card.ID,
				CustomerID:  card.UserID,
				ClientName:  clientName,
				ClientEmail: clientEmail,
				StaffID:     staffUser.ID,
				BusinessID:  campaignBusinessID,
				TokenJTI:    tokenClaims.ID,
			}
			return tx.Create(&txRecord).Error
		} else {
			// Redeem reward
			finalAction = "REDEEM"
			newStamps = 0
			message = "Reward successfully redeemed!"

			if err := tx.Model(&card).Update("stamps", 0).Error; err != nil {
				return err
			}

			txRecord := models.Transaction{
				Type:        models.TxRedeem,
				Amount:      card.Campaign.StampsRequired,
				CardID:      card.ID,
				CustomerID:  card.UserID,
				ClientName:  clientName,
				ClientEmail: clientEmail,
				StaffID:     staffUser.ID,
				BusinessID:  campaignBusinessID,
				TokenJTI:    tokenClaims.ID,
			}
			return tx.Create(&txRecord).Error
		}
	})

	if err != nil {
		metrics.ScansTotal.WithLabelValues("tx_failed").Inc()
		respondError(w, http.StatusInternalServerError, "Transaction failed: "+err.Error())
		return
	}

	// 7. Dispatch async event to RabbitMQ & notify live SSE card subscribers immediately
	metrics.ScansTotal.WithLabelValues("success").Inc()
	metrics.StampsTotal.WithLabelValues(finalAction).Inc()

	NotifyCardUpdate(card.ID, newStamps, finalAction)
	env.EventBus.PublishStampEvent(r.Context(), events.StampEvent{
		Type:          finalAction,
		CardID:        card.ID,
		CampaignID:    card.CampaignID,
		BusinessID:    campaignBusinessID,
		StaffID:       staffUser.ID,
		StampsCurrent: newStamps,
	})

	card.Stamps = newStamps

	respondJSON(w, http.StatusOK, ScanResponse{
		Success:  true,
		Action:   finalAction,
		Message:  message,
		NewCount: newStamps,
		Card:     card,
	})
}
