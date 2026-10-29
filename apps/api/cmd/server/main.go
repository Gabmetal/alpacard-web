package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gabmetal/alpacard/api/internal/auth"
	"github.com/gabmetal/alpacard/api/internal/config"
	"github.com/gabmetal/alpacard/api/internal/db"
	"github.com/gabmetal/alpacard/api/internal/events"
	"github.com/gabmetal/alpacard/api/internal/handlers"
	"github.com/gabmetal/alpacard/api/internal/metrics"
	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func main() {
	log.Println("Starting Alpacard API Server...")

	cfg := config.Load()

	// Initialize Database (Postgres or SQLite)
	database, err := db.Init(cfg)
	if err != nil {
		log.Fatalf("Fatal: Database initialization failed: %v", err)
	}

	// Start background database connection pool metrics collector
	metrics.StartDBCollector(database, 10*time.Second)

	// Initialize RabbitMQ Event Bus
	eventBus := events.NewEventBus(cfg.RabbitMQURL)
	defer eventBus.Close()

	env := &handlers.Env{
		DB:       database,
		Config:   cfg,
		EventBus: eventBus,
	}

	r := chi.NewRouter()

	// Global middlewares
	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.RealIP)
	r.Use(metrics.Middleware()) // Prometheus HTTP metrics middleware
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)

	// CORS configuration
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   cfg.CORSOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Prometheus Metrics Endpoint
	r.Handle("/metrics", promhttp.Handler())
	r.Handle("/api/metrics", promhttp.Handler())

	// Health Check
	healthHandler := func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"healthy","service":"alpacard-api","time":"` + time.Now().UTC().Format(time.RFC3339) + `"}`))
	}
	r.Get("/health", healthHandler)
	r.Get("/api/health", healthHandler)

	// Static uploads directory serving
	uploadDir := os.Getenv("UPLOAD_DIR")
	if uploadDir == "" {
		uploadDir = "./uploads"
	}
	_ = os.MkdirAll(uploadDir, 0755)
	fileServer := http.FileServer(http.Dir(uploadDir))
	r.Handle("/api/uploads/*", http.StripPrefix("/api/uploads/", fileServer))

	// API Routes
	r.Route("/api/v1", func(api chi.Router) {
		// Public Auth
		api.Route("/auth", func(a chi.Router) {
			a.Post("/register", env.Register)
			a.Post("/login", env.Login)
			a.Post("/guest", env.GuestLogin)
			a.Get("/verify-email", env.VerifyEmail)
			a.Post("/resend-verification", env.ResendVerificationEmail)
			a.Post("/forgot-password", env.ForgotPassword)
			a.Post("/reset-password", env.ResetPassword)

			// Authenticated user profile, settings & account management
			a.With(auth.RequireAuth(cfg.JWTSecret)).Get("/me", env.Me)
			a.With(auth.RequireAuth(cfg.JWTSecret)).Put("/profile", env.UpdateProfile)
			a.With(auth.RequireAuth(cfg.JWTSecret)).Delete("/account", env.DeleteAccount)
			a.With(auth.RequireAuth(cfg.JWTSecret)).Post("/link-guest", env.LinkGuestCards)
			a.With(auth.RequireAuth(cfg.JWTSecret)).Post("/change-password", env.ChangePassword)
		})

		// Campaigns (Public inspection + Authenticated management)
		api.Route("/campaigns", func(c chi.Router) {
			c.Get("/", env.ListCampaigns)
			c.Get("/{id}", env.GetCampaign)
			c.With(auth.RequireAuth(cfg.JWTSecret)).Post("/", env.CreateCampaign)
			c.With(auth.RequireAuth(cfg.JWTSecret)).Put("/{id}", env.UpdateCampaign)
			c.With(auth.RequireAuth(cfg.JWTSecret)).Delete("/{id}", env.DeleteCampaign)
		})

		// Protected Merchant Routes
		api.Group(func(protected chi.Router) {
			protected.Use(auth.RequireAuth(cfg.JWTSecret))

			// File Uploads (Logos & Card Backgrounds)
			protected.Post("/upload", env.UploadFile)

			// Business
			protected.Route("/businesses", func(b chi.Router) {
				b.Post("/", env.CreateBusiness)
				b.Get("/mine", env.GetMyBusinesses)
				b.Put("/{businessId}", env.UpdateBusiness)
				b.Get("/{businessId}/staff", env.ListStaff)
				b.Post("/{businessId}/staff", env.AddStaff)
				b.Delete("/{businessId}/staff/{staffId}", env.RemoveStaff)
				b.Get("/{businessId}/stats", env.GetDashboardStats)
			})

			// Cards / Wallet
			protected.Route("/cards", func(cd chi.Router) {
				cd.Post("/claim", env.ClaimCard)
				cd.Get("/mine", env.GetMyCards)
				cd.Get("/{id}", env.GetCardDetail)
				cd.Get("/{id}/qr", env.GetCardQRToken)
				cd.Get("/{id}/events", env.StreamCardEvents)
			})

			// Scanner
			protected.Post("/scan", env.VerifyAndAddStamp)
		})
	})

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.Port),
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown handling
	serverErrors := make(chan error, 1)
	go func() {
		log.Printf("Alpacard API listening on port %s", cfg.Port)
		serverErrors <- srv.ListenAndServe()
	}()

	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM)

	select {
	case err := <-serverErrors:
		log.Fatalf("Error starting server: %v", err)
	case sig := <-shutdown:
		log.Printf("Signal %v received, shutting down gracefully...", sig)
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := srv.Shutdown(ctx); err != nil {
			log.Printf("Graceful shutdown failed: %v", err)
			_ = srv.Close()
		}
	}

	log.Println("Server gracefully stopped.")
}
