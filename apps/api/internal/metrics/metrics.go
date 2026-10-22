package metrics

import (
	"database/sql"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"gorm.io/gorm"
)

var (
	once sync.Once

	// HTTP API Metrics
	HTTPRequestsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: "alpacard",
			Subsystem: "http",
			Name:      "requests_total",
			Help:      "Total number of HTTP requests processed by Alpacard API",
		},
		[]string{"method", "path", "status"},
	)

	HTTPRequestDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Namespace: "alpacard",
			Subsystem: "http",
			Name:      "request_duration_seconds",
			Help:      "Histogram of HTTP request latencies for Alpacard API",
			Buckets:   []float64{0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10},
		},
		[]string{"method", "path", "status"},
	)

	HTTPRequestsInFlight = promauto.NewGauge(
		prometheus.GaugeOpts{
			Namespace: "alpacard",
			Subsystem: "http",
			Name:      "requests_in_flight",
			Help:      "Current number of in-flight HTTP requests being served",
		},
	)

	// Business Domain Metrics
	StampsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: "alpacard",
			Subsystem: "business",
			Name:      "stamps_total",
			Help:      "Total number of stamp operations (EARN or REDEEM)",
		},
		[]string{"action"},
	)

	ScansTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: "alpacard",
			Subsystem: "business",
			Name:      "scans_total",
			Help:      "Total number of QR scan attempts by outcome status",
		},
		[]string{"status"},
	)

	CardsClaimedTotal = promauto.NewCounter(
		prometheus.CounterOpts{
			Namespace: "alpacard",
			Subsystem: "business",
			Name:      "cards_claimed_total",
			Help:      "Total number of loyalty cards claimed by customers",
		},
	)

	UsersRegisteredTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: "alpacard",
			Subsystem: "business",
			Name:      "users_registered_total",
			Help:      "Total number of user accounts created by role",
		},
		[]string{"role"},
	)

	QRTokensGeneratedTotal = promauto.NewCounter(
		prometheus.CounterOpts{
			Namespace: "alpacard",
			Subsystem: "business",
			Name:      "qr_tokens_generated_total",
			Help:      "Total number of rotating single-use QR tokens generated",
		},
	)

	SSESubscribers = promauto.NewGauge(
		prometheus.GaugeOpts{
			Namespace: "alpacard",
			Subsystem: "sse",
			Name:      "active_subscribers",
			Help:      "Number of currently active SSE subscribers watching card updates",
		},
	)

	// Business Scale & Growth Metrics (Updated periodically from DB)
	MerchantsTotal = promauto.NewGauge(
		prometheus.GaugeOpts{
			Namespace: "alpacard",
			Subsystem: "business",
			Name:      "merchants_total",
			Help:      "Total number of registered business entities / merchants",
		},
	)

	CampaignsActiveTotal = promauto.NewGauge(
		prometheus.GaugeOpts{
			Namespace: "alpacard",
			Subsystem: "business",
			Name:      "campaigns_active_total",
			Help:      "Total number of active loyalty campaigns across all merchants",
		},
	)

	UsersByRoleTotal = promauto.NewGaugeVec(
		prometheus.GaugeOpts{
			Namespace: "alpacard",
			Subsystem: "business",
			Name:      "users_total",
			Help:      "Total number of registered user accounts by role",
		},
		[]string{"role"},
	)

	CardsActiveTotal = promauto.NewGauge(
		prometheus.GaugeOpts{
			Namespace: "alpacard",
			Subsystem: "business",
			Name:      "cards_active_total",
			Help:      "Total number of active customer punch cards in wallets",
		},
	)

	LifetimeStampsTotal = promauto.NewGauge(
		prometheus.GaugeOpts{
			Namespace: "alpacard",
			Subsystem: "business",
			Name:      "lifetime_stamps_total",
			Help:      "Cumulative sum of stamps currently held across all cards",
		},
	)

	LifetimeTransactionsTotal = promauto.NewGaugeVec(
		prometheus.GaugeOpts{
			Namespace: "alpacard",
			Subsystem: "business",
			Name:      "lifetime_transactions_total",
			Help:      "Total completed transactions by type (EARN or REDEEM)",
		},
		[]string{"type"},
	)

	// Database Metrics
	DBConnectionsOpen = promauto.NewGauge(
		prometheus.GaugeOpts{
			Namespace: "alpacard",
			Subsystem: "db",
			Name:      "connections_open",
			Help:      "Number of established database connections",
		},
	)

	DBConnectionsInUse = promauto.NewGauge(
		prometheus.GaugeOpts{
			Namespace: "alpacard",
			Subsystem: "db",
			Name:      "connections_in_use",
			Help:      "Number of connections currently in use",
		},
	)

	DBConnectionsIdle = promauto.NewGauge(
		prometheus.GaugeOpts{
			Namespace: "alpacard",
			Subsystem: "db",
			Name:      "connections_idle",
			Help:      "Number of idle connections in pool",
		},
	)

	// Event Bus Metrics
	RabbitMQConnected = promauto.NewGauge(
		prometheus.GaugeOpts{
			Namespace: "alpacard",
			Subsystem: "rabbitmq",
			Name:      "connected",
			Help:      "RabbitMQ connection status (1 = connected, 0 = disconnected)",
		},
	)

	EventsPublishedTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: "alpacard",
			Subsystem: "rabbitmq",
			Name:      "events_published_total",
			Help:      "Total number of events published to RabbitMQ",
		},
		[]string{"event_type", "status"},
	)
)

// Middleware returns a Chi middleware that records request count and duration.
func Middleware() func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Skip recording /metrics to prevent scraping recursion
			if r.URL.Path == "/metrics" {
				next.ServeHTTP(w, r)
				return
			}

			start := time.Now()
			HTTPRequestsInFlight.Inc()
			defer HTTPRequestsInFlight.Dec()

			ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)
			next.ServeHTTP(ww, r)

			duration := time.Since(start).Seconds()
			statusStr := strconv.Itoa(ww.Status())

			// Normalize path pattern from Chi route context if available
			path := r.URL.Path
			if routeCtx := chi.RouteContext(r.Context()); routeCtx != nil {
				pattern := routeCtx.RoutePattern()
				if pattern != "" {
					path = pattern
				}
			}

			// Clean path for known prefixes
			path = cleanPath(path)

			HTTPRequestsTotal.WithLabelValues(r.Method, path, statusStr).Inc()
			HTTPRequestDuration.WithLabelValues(r.Method, path, statusStr).Observe(duration)
		})
	}
}

// cleanPath normalizes parameter paths to avoid metric cardinality explosions
func cleanPath(p string) string {
	if strings.HasPrefix(p, "/api/uploads/") {
		return "/api/uploads/*"
	}
	return p
}

// StartDBCollector runs a periodic goroutine updating database connection and business scale stats
func StartDBCollector(db *gorm.DB, interval time.Duration) {
	sqlDB, err := db.DB()
	if err != nil {
		return
	}

	// Initial immediate collection
	updateDBStats(sqlDB)
	updateBusinessStats(db)

	go func() {
		ticker := time.NewTicker(interval)
		defer ticker.Stop()

		for range ticker.C {
			updateDBStats(sqlDB)
			updateBusinessStats(db)
		}
	}()
}

func updateDBStats(sqlDB *sql.DB) {
	stats := sqlDB.Stats()
	DBConnectionsOpen.Set(float64(stats.OpenConnections))
	DBConnectionsInUse.Set(float64(stats.InUse))
	DBConnectionsIdle.Set(float64(stats.Idle))
}

func updateBusinessStats(db *gorm.DB) {
	var merchantsCount int64
	if err := db.Table("businesses").Where("deleted_at IS NULL").Count(&merchantsCount).Error; err == nil {
		MerchantsTotal.Set(float64(merchantsCount))
	}

	var campaignsCount int64
	if err := db.Table("campaigns").Where("is_active = true AND deleted_at IS NULL").Count(&campaignsCount).Error; err == nil {
		CampaignsActiveTotal.Set(float64(campaignsCount))
	}

	type roleCount struct {
		Role  string
		Count int64
	}
	var roles []roleCount
	if err := db.Table("users").Select("role, count(*) as count").Where("deleted_at IS NULL").Group("role").Scan(&roles).Error; err == nil {
		for _, r := range roles {
			UsersByRoleTotal.WithLabelValues(r.Role).Set(float64(r.Count))
		}
	}

	var cardsCount int64
	if err := db.Table("cards").Where("deleted_at IS NULL").Count(&cardsCount).Error; err == nil {
		CardsActiveTotal.Set(float64(cardsCount))
	}

	var stampsSum struct {
		Total int64
	}
	if err := db.Table("cards").Select("COALESCE(SUM(stamps), 0) as total").Where("deleted_at IS NULL").Scan(&stampsSum).Error; err == nil {
		LifetimeStampsTotal.Set(float64(stampsSum.Total))
	}

	type txCount struct {
		Type  string
		Count int64
	}
	var txs []txCount
	if err := db.Table("transactions").Select("type, count(*) as count").Where("deleted_at IS NULL").Group("type").Scan(&txs).Error; err == nil {
		for _, t := range txs {
			LifetimeTransactionsTotal.WithLabelValues(t.Type).Set(float64(t.Count))
		}
	}
}
