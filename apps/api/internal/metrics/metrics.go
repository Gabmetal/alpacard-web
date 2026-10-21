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

// StartDBCollector runs a periodic goroutine updating database connection stats
func StartDBCollector(db *gorm.DB, interval time.Duration) {
	sqlDB, err := db.DB()
	if err != nil {
		return
	}

	go func() {
		ticker := time.NewTicker(interval)
		defer ticker.Stop()

		for range ticker.C {
			updateDBStats(sqlDB)
		}
	}()
}

func updateDBStats(sqlDB *sql.DB) {
	stats := sqlDB.Stats()
	DBConnectionsOpen.Set(float64(stats.OpenConnections))
	DBConnectionsInUse.Set(float64(stats.InUse))
	DBConnectionsIdle.Set(float64(stats.Idle))
}
