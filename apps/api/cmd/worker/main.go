package main

import (
	"encoding/json"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gabmetal/alpacard/api/internal/config"
	"github.com/gabmetal/alpacard/api/internal/events"
	amqp "github.com/rabbitmq/amqp091-go"
)

func main() {
	log.Println("Starting Alpacard RabbitMQ Event Worker...")

	cfg := config.Load()
	if cfg.RabbitMQURL == "" {
		log.Println("RABBITMQ_URL is not set. Worker is idling. Set RABBITMQ_URL to consume events.")
		select {}
	}

	var conn *amqp.Connection
	var err error
	for i := 1; i <= 15; i++ {
		conn, err = amqp.Dial(cfg.RabbitMQURL)
		if err == nil {
			break
		}
		if i == 15 {
			log.Fatalf("Failed to connect to RabbitMQ after 15 attempts: %v", err)
		}
		log.Printf("RabbitMQ not ready yet (attempt %d/15). Retrying in 2 seconds...", i)
		time.Sleep(2 * time.Second)
	}
	defer conn.Close()

	ch, err := conn.Channel()
	if err != nil {
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
		log.Fatalf("Failed to register consumer: %v", err)
	}

	log.Printf("Worker connected to RabbitMQ. Waiting for messages in '%s'...", events.StampQueue)

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		for msg := range msgs {
			var evt events.StampEvent
			if err := json.Unmarshal(msg.Body, &evt); err != nil {
				log.Printf("Error unmarshalling event: %v", err)
				continue
			}

			log.Printf("[EVENT CONSUMER] Received Stamp Event: Type=%s, Card=%s, Business=%s, Stamps=%d",
				evt.Type, evt.CardID, evt.BusinessID, evt.StampsCurrent)

			// Here you can trigger webhooks, push notifications (FCM/APNS), or external CRM events.
		}
	}()

	<-sigChan
	log.Println("Shutting down worker...")
}
