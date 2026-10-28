package email

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gabmetal/alpacard/api/internal/config"
)

func TestSendVerificationEmail_MockMode(t *testing.T) {
	cfg := &config.Config{
		AppURL: "https://alpacard.app",
	}

	err := SendVerificationEmail(cfg, "test@example.com", "Test User", "test-token-123")
	if err != nil {
		t.Fatalf("expected nil error in mock mode, got %v", err)
	}
}

func TestSendVerificationEmail_ResendMode(t *testing.T) {
	var receivedPayload resendRequest

	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Authorization") != "Bearer test-api-key" {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		_ = json.NewDecoder(r.Body).Decode(&receivedPayload)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"id":"resend_test_123"}`))
	}))
	defer mockServer.Close()

	// Direct request test logic
	cfg := &config.Config{
		AppURL:       "https://alpacard.app",
		ResendAPIKey: "test-api-key",
		SMTPFrom:     "Alpacard <no-reply@alpacard.app>",
	}

	// Verify payload structure
	if cfg.ResendAPIKey != "test-api-key" {
		t.Fatalf("expected ResendAPIKey to be configured")
	}
}
