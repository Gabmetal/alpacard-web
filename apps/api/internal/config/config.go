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
}

func Load() *Config {
	port := getEnv("PORT", "4000")
	dbDriver := getEnv("DB_DRIVER", "sqlite")
	databaseURL := getEnv("DATABASE_URL", "./alpacard.db")
	jwtSecret := getEnv("JWT_SECRET", "alpacard_default_jwt_secret_signing_key_2026")
	rabbitMQURL := getEnv("RABBITMQ_URL", "") // optional, e.g. "amqp://guest:guest@localhost:5672/"
	appURL := getEnv("APP_URL", "https://alpacard.gabo.lat")

	corsStr := getEnv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173,http://localhost:5174,https://alpacard.gabo.lat")
	corsOrigins := strings.Split(corsStr, ",")
	for i := range corsOrigins {
		corsOrigins[i] = strings.TrimSpace(corsOrigins[i])
	}

	return &Config{
		Port:        port,
		DBDriver:    dbDriver,
		DatabaseURL: databaseURL,
		JWTSecret:   jwtSecret,
		RabbitMQURL: rabbitMQURL,
		CORSOrigins: corsOrigins,
		AppURL:      appURL,
	}
}

func getEnv(key, defaultVal string) string {
	val, ok := os.LookupEnv(key)
	if !ok || val == "" {
		return defaultVal
	}
	return val
}
