package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strings"

	"github.com/gabmetal/alpacard/api/internal/auth"
	"github.com/gabmetal/alpacard/api/internal/models"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type CreateBusinessRequest struct {
	Name        string `json:"name"`
	LogoURL     string `json:"logoUrl"`
	BrandColor  string `json:"brandColor"`
	Description string `json:"description"`
	Category    string `json:"category"`
	Website     string `json:"website"`
	Instagram   string `json:"instagram"`
	MenuType    string `json:"menuType"`
	MenuURL     string `json:"menuUrl"`
	MenuItems   string `json:"menuItems"`
}

type UpdateBusinessRequest struct {
	Name        *string `json:"name"`
	LogoURL     *string `json:"logoUrl"`
	BrandColor  *string `json:"brandColor"`
	Description *string `json:"description"`
	Category    *string `json:"category"`
	Website     *string `json:"website"`
	Instagram   *string `json:"instagram"`
	MenuType    *string `json:"menuType"`
	MenuURL     *string `json:"menuUrl"`
	MenuItems   *string `json:"menuItems"`
}

type AddStaffRequest struct {
	Email string `json:"email"`
}

func (env *Env) CreateBusiness(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req CreateBusinessRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		respondError(w, http.StatusBadRequest, "Business name is required")
		return
	}

	// Create slug from name
	slug := generateSlug(req.Name)

	brandColor := strings.TrimSpace(req.BrandColor)
	if brandColor == "" {
		brandColor = "#4f46e5"
	}

	menuType := strings.TrimSpace(req.MenuType)
	if menuType == "" {
		menuType = "link"
	}

	business := models.Business{
		Name:        req.Name,
		Slug:        slug,
		LogoURL:     req.LogoURL,
		BrandColor:  brandColor,
		Description: req.Description,
		Category:    req.Category,
		Website:     req.Website,
		Instagram:   req.Instagram,
		MenuType:    menuType,
		MenuURL:     strings.TrimSpace(req.MenuURL),
		MenuItems:   strings.TrimSpace(req.MenuItems),
		OwnerID:     claims.UserID,
	}

	if err := env.DB.Create(&business).Error; err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create business")
		return
	}

	// Upgrade user to OWNER role if they are currently CONSUMER
	_ = env.DB.Model(&models.User{}).Where("id = ? AND role = ?", claims.UserID, models.RoleConsumer).Update("role", models.RoleOwner)

	respondJSON(w, http.StatusCreated, business)
}

func (env *Env) UpdateBusiness(w http.ResponseWriter, r *http.Request) {
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
	if err := env.DB.First(&business, "id = ?", businessID).Error; err != nil {
		respondError(w, http.StatusNotFound, "Business not found")
		return
	}

	if business.OwnerID != claims.UserID {
		respondError(w, http.StatusForbidden, "Only the business owner can edit business settings")
		return
	}

	var req UpdateBusinessRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if req.Name != nil && strings.TrimSpace(*req.Name) != "" {
		business.Name = strings.TrimSpace(*req.Name)
	}
	if req.LogoURL != nil {
		business.LogoURL = strings.TrimSpace(*req.LogoURL)
	}
	if req.BrandColor != nil && strings.TrimSpace(*req.BrandColor) != "" {
		business.BrandColor = strings.TrimSpace(*req.BrandColor)
	}
	if req.Description != nil {
		business.Description = strings.TrimSpace(*req.Description)
	}
	if req.Category != nil {
		business.Category = strings.TrimSpace(*req.Category)
	}
	if req.Website != nil {
		business.Website = strings.TrimSpace(*req.Website)
	}
	if req.Instagram != nil {
		business.Instagram = strings.TrimSpace(*req.Instagram)
	}
	if req.MenuType != nil && strings.TrimSpace(*req.MenuType) != "" {
		business.MenuType = strings.TrimSpace(*req.MenuType)
	}
	if req.MenuURL != nil {
		business.MenuURL = strings.TrimSpace(*req.MenuURL)
	}
	if req.MenuItems != nil {
		business.MenuItems = strings.TrimSpace(*req.MenuItems)
	}

	if err := env.DB.Save(&business).Error; err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to update business")
		return
	}

	respondJSON(w, http.StatusOK, business)
}

func (env *Env) GetMyBusinesses(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	owned := make([]models.Business, 0)
	if err := env.DB.Preload("Campaigns").Where("owner_id = ?", claims.UserID).Find(&owned).Error; err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch businesses")
		return
	}

	var user models.User
	_ = env.DB.Preload("StaffAt.Campaigns").First(&user, "id = ?", claims.UserID)
	staffAt := user.StaffAt
	if staffAt == nil {
		staffAt = make([]models.Business, 0)
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"owned":   owned,
		"staffAt": staffAt,
	})
}

func (env *Env) ListStaff(w http.ResponseWriter, r *http.Request) {
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
	if err := env.DB.First(&business, "id = ?", businessID).Error; err != nil {
		respondError(w, http.StatusNotFound, "Business not found")
		return
	}

	if business.OwnerID != claims.UserID {
		respondError(w, http.StatusForbidden, "Only the business owner can view staff")
		return
	}

	staff := make([]models.User, 0)
	_ = env.DB.Model(&business).Association("Staff").Find(&staff)

	respondJSON(w, http.StatusOK, staff)
}

func (env *Env) AddStaff(w http.ResponseWriter, r *http.Request) {
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
	if err := env.DB.First(&business, "id = ?", businessID).Error; err != nil {
		respondError(w, http.StatusNotFound, "Business not found")
		return
	}

	if business.OwnerID != claims.UserID {
		respondError(w, http.StatusForbidden, "Only the business owner can add staff")
		return
	}

	var req AddStaffRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	var targetUser models.User
	if err := env.DB.Where("email = ?", req.Email).First(&targetUser).Error; err != nil {
		respondError(w, http.StatusNotFound, "User not found. They must register an account first.")
		return
	}

	if targetUser.ID == claims.UserID {
		respondError(w, http.StatusBadRequest, "Owner is already part of the business")
		return
	}

	// Associate staff
	if err := env.DB.Model(&business).Association("Staff").Append(&targetUser); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to add staff")
		return
	}

	// Update target role if consumer
	if targetUser.Role == models.RoleConsumer {
		_ = env.DB.Model(&targetUser).Update("role", models.RoleStaff)
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "Staff added successfully"})
}

func (env *Env) RemoveStaff(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	businessIDStr := chi.URLParam(r, "businessId")
	businessID, err := uuid.Parse(businessIDStr)
	staffIDStr := chi.URLParam(r, "staffId")
	staffID, err2 := uuid.Parse(staffIDStr)
	if err != nil || err2 != nil {
		respondError(w, http.StatusBadRequest, "Invalid business or staff ID")
		return
	}

	var business models.Business
	if err := env.DB.First(&business, "id = ?", businessID).Error; err != nil {
		respondError(w, http.StatusNotFound, "Business not found")
		return
	}

	if business.OwnerID != claims.UserID {
		respondError(w, http.StatusForbidden, "Only the business owner can remove staff")
		return
	}

	var targetUser models.User
	if err := env.DB.First(&targetUser, "id = ?", staffID).Error; err != nil {
		respondError(w, http.StatusNotFound, "Staff member not found")
		return
	}

	_ = env.DB.Model(&business).Association("Staff").Delete(&targetUser)

	respondJSON(w, http.StatusOK, map[string]string{"message": "Staff removed successfully"})
}

func generateSlug(name string) string {
	reg := regexp.MustCompile("[^a-zA-Z0-9]+")
	slug := strings.ToLower(reg.ReplaceAllString(name, "-"))
	slug = strings.Trim(slug, "-")
	return fmt.Sprintf("%s-%s", slug, uuid.New().String()[:6])
}
