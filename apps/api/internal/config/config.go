package config

import (
	"os"
	"strings"
)

type Config struct {
	Port         string
	DBDriver     string // "postgres" or "sqlite"
	DatabaseURL  string
	JWTSecret    string
	RabbitMQURL  string
	CORSOrigins  []string
	AppURL       string
	WalletURL    string
	ResendAPIKey string
	SMTPHost     string
	SMTPPort     string
	SMTPUser     string
	SMTPPassword string
	SMTPFrom     string
}

func Load() *Config {
	port := getEnv("PORT", "4000")
	dbDriver := getEnv("DB_DRIVER", "sqlite")
	databaseURL := getEnv("DATABASE_URL", "./alpacard.db")
	jwtSecret := getEnv("JWT_SECRET", "alpacard_default_jwt_secret_signing_key_2026")
	rabbitMQURL := getEnv("RABBITMQ_URL", "") // optional, e.g. "amqp://guest:guest@localhost:5672/"
	appURL := getEnv("APP_URL", "https://alpacard.app")
	walletURL := getEnv("WALLET_URL", "")
	if walletURL == "" {
		if strings.Contains(appURL, "dev.alpacard.app") || strings.Contains(appURL, "dev.alpacard.local") {
			walletURL = "https://dev-wallet.alpacard.app"
		} else if strings.Contains(appURL, "localhost") {
			walletURL = "http://localhost:5174"
		} else {
			walletURL = "https://wallet.alpacard.app"
		}
	}
	resendAPIKey := getEnv("RESEND_API_KEY", "")
	smtpHost := getEnv("SMTP_HOST", "")
	smtpPort := getEnv("SMTP_PORT", "587")
	smtpUser := getEnv("SMTP_USER", "")
	smtpPassword := getEnv("SMTP_PASSWORD", "")
	smtpFrom := getEnv("SMTP_FROM", "Alpacard <no-reply@alpacard.app>")

	corsStr := getEnv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173,http://localhost:5174,https://alpacard.app,https://www.alpacard.app,https://merchant.alpacard.app,https://wallet.alpacard.app,https://demo.alpacard.app,https://dev.alpacard.app,https://dev-merchant.alpacard.app,https://dev-wallet.alpacard.app,https://dev-demo.alpacard.app")
	corsOrigins := strings.Split(corsStr, ",")
	for i := range corsOrigins {
		corsOrigins[i] = strings.TrimSpace(corsOrigins[i])
	}

	return &Config{
		Port:         port,
		DBDriver:     dbDriver,
		DatabaseURL:  databaseURL,
		JWTSecret:    jwtSecret,
		RabbitMQURL:  rabbitMQURL,
		CORSOrigins:  corsOrigins,
		AppURL:       appURL,
		WalletURL:    walletURL,
		ResendAPIKey: resendAPIKey,
		SMTPHost:     smtpHost,
		SMTPPort:     smtpPort,
		SMTPUser:     smtpUser,
		SMTPPassword: smtpPassword,
		SMTPFrom:     smtpFrom,
	}
}

func getEnv(key, defaultVal string) string {
	val, ok := os.LookupEnv(key)
	if !ok || val == "" {
		return defaultVal
	}
	return val
}
