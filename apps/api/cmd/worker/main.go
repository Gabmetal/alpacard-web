package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gabmetal/alpacard/api/internal/config"
	"github.com/gabmetal/alpacard/api/internal/events"
	metrics "github.com/gabmetal/alpacard/api/internal/workermetrics"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	amqp "github.com/rabbitmq/amqp091-go"
)

func main() {
	log.Println("Starting Alpacard RabbitMQ Event Worker...")

	metricsPort := os.Getenv("METRICS_PORT")
	if metricsPort == "" {
		metricsPort = "9090"
	}

	// Start Prometheus /metrics and /health HTTP server
	mux := http.NewServeMux()
	mux.Handle("/metrics", promhttp.Handler())
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"healthy","service":"alpacard-worker"}`))
	})

	metricsServer := &http.Server{
		Addr:         fmt.Sprintf(":%s", metricsPort),
		Handler:      mux,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 5 * time.Second,
	}

	go func() {
		log.Printf("Alpacard Worker Metrics HTTP server listening on :%s", metricsPort)
		if err := metricsServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Printf("Worker metrics HTTP server error: %v", err)
		}
	}()

	metrics.WorkerUp.Set(1)
	defer metrics.WorkerUp.Set(0)

	cfg := config.Load()
	if cfg.RabbitMQURL == "" {
		log.Println("RABBITMQ_URL is not set. Worker is idling. Set RABBITMQ_URL to consume events.")
		metrics.WorkerRabbitMQConnected.Set(0)
		select {}
	}

	var conn *amqp.Connection
	var err error
	for i := 1; i <= 15; i++ {
		conn, err = amqp.Dial(cfg.RabbitMQURL)
		if err == nil {
			break
		}
		metrics.WorkerRabbitMQConnected.Set(0)
		if i == 15 {
			log.Fatalf("Failed to connect to RabbitMQ after 15 attempts: %v", err)
		}
		log.Printf("RabbitMQ not ready yet (attempt %d/15). Retrying in 2 seconds...", i)
		time.Sleep(2 * time.Second)
	}
	defer conn.Close()
	metrics.WorkerRabbitMQConnected.Set(1)

	ch, err := conn.Channel()
	if err != nil {
		metrics.WorkerRabbitMQConnected.Set(0)
		log.Fatalf("Failed to open channel: %v", err)
	}
	defer ch.Close()

	// Ensure exchange and queue exist
	_ = ch.ExchangeDeclare(
		events.ExchangeName,
		"topic",
		true,  // durable
		false, // auto-deleted
		false, // internal
		false, // no-wait
		nil,
	)

	q, err := ch.QueueDeclare(
		events.StampQueue,
		true,  // durable
		false, // auto-delete
		false, // exclusive
		false, // no-wait
		nil,
	)
	if err == nil {
		_ = ch.QueueBind(
			q.Name,
			events.StampRouting,
			events.ExchangeName,
			false,
			nil,
		)
	}

	msgs, err := ch.Consume(
		events.StampQueue,
		"alpacard-worker",
		true,  // auto-ack
		false, // exclusive
		false, // no-local
		false, // no-wait
		nil,
	)
	if err != nil {
		metrics.WorkerRabbitMQConnected.Set(0)
		log.Fatalf("Failed to register consumer: %v", err)
	}

	log.Printf("Worker connected to RabbitMQ. Waiting for messages in '%s'...", events.StampQueue)

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		for msg := range msgs {
			start := time.Now()
			var evt events.StampEvent
			if err := json.Unmarshal(msg.Body, &evt); err != nil {
				log.Printf("Error unmarshalling event: %v", err)
				metrics.WorkerEventsProcessedTotal.WithLabelValues("unknown", "error").Inc()
				continue
			}

			eventType := evt.Type
			if eventType == "" {
				eventType = "unknown"
			}

			metrics.WorkerEventsReceivedTotal.WithLabelValues(eventType).Inc()

			log.Printf("[EVENT CONSUMER] Received Stamp Event: Type=%s, Card=%s, Business=%s, Stamps=%d",
				evt.Type, evt.CardID, evt.BusinessID, evt.StampsCurrent)

			// Here you can trigger webhooks, push notifications (FCM/APNS), or external CRM events.
			duration := time.Since(start).Seconds()
			metrics.WorkerEventDuration.WithLabelValues(eventType).Observe(duration)
			metrics.WorkerEventsProcessedTotal.WithLabelValues(eventType, "success").Inc()
		}
	}()

	<-sigChan
	log.Println("Shutting down worker...")
	metrics.WorkerRabbitMQConnected.Set(0)

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = metricsServer.Shutdown(shutdownCtx)
}
