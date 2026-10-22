package workermetrics

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	// Worker Metrics
	WorkerUp = promauto.NewGauge(
		prometheus.GaugeOpts{
			Namespace: "alpacard",
			Subsystem: "worker",
			Name:      "up",
			Help:      "Status of the Alpacard RabbitMQ worker (1 = running)",
		},
	)

	WorkerRabbitMQConnected = promauto.NewGauge(
		prometheus.GaugeOpts{
			Namespace: "alpacard",
			Subsystem: "worker",
			Name:      "rabbitmq_connected",
			Help:      "RabbitMQ connection status in worker (1 = connected, 0 = disconnected)",
		},
	)

	WorkerEventsReceivedTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: "alpacard",
			Subsystem: "worker",
			Name:      "events_received_total",
			Help:      "Total number of events consumed by the background worker",
		},
		[]string{"event_type"},
	)

	WorkerEventsProcessedTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: "alpacard",
			Subsystem: "worker",
			Name:      "events_processed_total",
			Help:      "Total number of events processed by the background worker by status",
		},
		[]string{"event_type", "status"},
	)

	WorkerEventDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Namespace: "alpacard",
			Subsystem: "worker",
			Name:      "event_duration_seconds",
			Help:      "Processing latency for events consumed by the worker",
			Buckets:   []float64{0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2},
		},
		[]string{"event_type"},
	)
)
