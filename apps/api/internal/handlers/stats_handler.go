package handlers

import (
	"net/http"

	"github.com/gabmetal/alpacard/api/internal/auth"
	"github.com/gabmetal/alpacard/api/internal/models"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type DashboardStats struct {
	CampaignsCount     int64                `json:"campaignsCount"`
	StaffCount         int                  `json:"staffCount"`
	CardsCount         int64                `json:"cardsCount"`
	TotalStampsIssued  int64                `json:"totalStampsIssued"`
	RewardsRedeemed    int64                `json:"rewardsRedeemed"`
	RecentTransactions []models.Transaction `json:"recentTransactions"`
}

func (env *Env) GetDashboardStats(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	businessIDStr := chi.URLParam(r, "businessId")
	businessID, err := uuid.Parse(businessIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid business ID")
		return
	}

	var business models.Business
	if err := env.DB.Preload("Staff").First(&business, "id = ?", businessID).Error; err != nil {
		respondError(w, http.StatusNotFound, "Business not found")
		return
	}

	// Verify user is owner or staff
	isOwner := business.OwnerID == claims.UserID
	isStaff := false
	for _, s := range business.Staff {
		if s.ID == claims.UserID {
			isStaff = true
			break
		}
	}
	if !isOwner && !isStaff {
		respondError(w, http.StatusForbidden, "Unauthorized to view business metrics")
		return
	}

	var stats DashboardStats
	stats.StaffCount = len(business.Staff)

	// Campaigns count
	env.DB.Model(&models.Campaign{}).Where("business_id = ? AND is_active = ?", businessID, true).Count(&stats.CampaignsCount)

	// Cards count
	env.DB.Model(&models.Card{}).Joins("JOIN campaigns ON campaigns.id = cards.campaign_id").Where("campaigns.business_id = ?", businessID).Count(&stats.CardsCount)

	// Total stamps current sum
	var totalStamps struct{ Total int64 }
	env.DB.Model(&models.Card{}).Select("COALESCE(SUM(stamps), 0) as total").Joins("JOIN campaigns ON campaigns.id = cards.campaign_id").Where("campaigns.business_id = ?", businessID).Scan(&totalStamps)
	stats.TotalStampsIssued = totalStamps.Total

	// Rewards redeemed count
	env.DB.Model(&models.Transaction{}).Where("business_id = ? AND type = ?", businessID, models.TxRedeem).Count(&stats.RewardsRedeemed)

	// Recent transactions
	env.DB.Preload("Staff").Preload("Card.Campaign").Where("business_id = ?", businessID).Order("created_at desc").Limit(10).Find(&stats.RecentTransactions)

	respondJSON(w, http.StatusOK, stats)
}
