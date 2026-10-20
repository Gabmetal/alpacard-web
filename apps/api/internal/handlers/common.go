package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/gabmetal/alpacard/api/internal/config"
	"github.com/gabmetal/alpacard/api/internal/events"
	"gorm.io/gorm"
)

type Env struct {
	DB       *gorm.DB
	Config   *config.Config
	EventBus *events.EventBus
}

func respondJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}
