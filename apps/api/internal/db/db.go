package db

import (
	"fmt"
	"log"
	"time"

	"github.com/gabmetal/alpacard/api/internal/config"
	"github.com/gabmetal/alpacard/api/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Init(cfg *config.Config) (*gorm.DB, error) {
	var dialector gorm.Dialector

	switch cfg.DBDriver {
	case "postgres":
		log.Printf("Connecting to PostgreSQL at %s", sanitizeDBURL(cfg.DatabaseURL))
		dialector = postgres.Open(cfg.DatabaseURL)
	case "sqlite":
		fallthrough
	default:
		log.Printf("Using SQLite database at %s", cfg.DatabaseURL)
		dialector = sqlite.Open(cfg.DatabaseURL)
	}

	var database *gorm.DB
	var err error

	// Retry database connection up to 15 times (30s) during cold boot
	maxRetries := 15
	for i := 1; i <= maxRetries; i++ {
		database, err = gorm.Open(dialector, &gorm.Config{
			Logger: logger.Default.LogMode(logger.Warn),
		})
		if err == nil {
			sqlDB, dbErr := database.DB()
			if dbErr == nil {
				if pingErr := sqlDB.Ping(); pingErr == nil {
					break
				}
			}
		}

		if i == maxRetries {
			return nil, fmt.Errorf("failed to connect to database after %d attempts: %w", maxRetries, err)
		}

		log.Printf("Database not ready yet (attempt %d/%d). Retrying in 2 seconds...", i, maxRetries)
		time.Sleep(2 * time.Second)
	}

	sqlDB, err := database.DB()
	if err == nil {
		sqlDB.SetMaxIdleConns(10)
		sqlDB.SetMaxOpenConns(50)
		sqlDB.SetConnMaxLifetime(time.Hour)
	}

	// Auto-migrate schema
	log.Println("Running database migrations...")
	err = database.AutoMigrate(
		&models.User{},
		&models.Business{},
		&models.Campaign{},
		&models.Card{},
		&models.Transaction{},
		&models.ScannedToken{},
	)
	if err != nil {
		return nil, fmt.Errorf("failed to migrate database: %w", err)
	}

	log.Println("Database migration completed successfully.")
	return database, nil
}

func sanitizeDBURL(raw string) string {
	if len(raw) > 20 {
		return raw[:12] + "..."
	}
	return raw
}
