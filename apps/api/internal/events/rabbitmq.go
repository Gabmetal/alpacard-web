package events

import (
	"context"
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/gabmetal/alpacard/api/internal/metrics"
	"github.com/google/uuid"
	amqp "github.com/rabbitmq/amqp091-go"
)

const (
	ExchangeName = "alpacard.events"
	StampQueue   = "alpacard.stamps.queue"
	StampRouting = "alpacard.stamp.#"
)

type StampEvent struct {
	EventID       uuid.UUID `json:"eventId"`
	Type          string    `json:"type"` // "EARN" or "REDEEM"
	CardID        uuid.UUID `json:"cardId"`
	CampaignID    uuid.UUID `json:"campaignId"`
	BusinessID    uuid.UUID `json:"businessId"`
	StaffID       uuid.UUID `json:"staffId"`
	StampsCurrent int       `json:"stampsCurrent"`
	Timestamp     time.Time `json:"timestamp"`
}

type EventBus struct {
	url      string
	conn     *amqp.Connection
	channel  *amqp.Channel
	mu       sync.Mutex
	isOnline bool
}

func NewEventBus(rabbitMQURL string) *EventBus {
	bus := &EventBus{
		url: rabbitMQURL,
	}

	if rabbitMQURL == "" {
		log.Println("RabbitMQ URL not provided. Event bus will operate in log-only mock mode.")
		metrics.RabbitMQConnected.Set(0)
		return bus
	}

	go bus.connect()
	return bus
}

func (b *EventBus) connect() {
	b.mu.Lock()
	defer b.mu.Unlock()

	conn, err := amqp.Dial(b.url)
	if err != nil {
		log.Printf("Warning: Failed to connect to RabbitMQ: %v (retrying in background)", err)
		b.isOnline = false
		metrics.RabbitMQConnected.Set(0)
		return
	}

	ch, err := conn.Channel()
	if err != nil {
		log.Printf("Warning: Failed to open RabbitMQ channel: %v", err)
		conn.Close()
		b.isOnline = false
		metrics.RabbitMQConnected.Set(0)
		return
	}

	// Declare topic exchange
	err = ch.ExchangeDeclare(
		ExchangeName,
		"topic",
		true,  // durable
		false, // auto-deleted
		false, // internal
		false, // no-wait
		nil,
	)
	if err != nil {
		log.Printf("Warning: Failed to declare exchange: %v", err)
		ch.Close()
		conn.Close()
		b.isOnline = false
		metrics.RabbitMQConnected.Set(0)
		return
	}

	// Declare stamps queue
	q, err := ch.QueueDeclare(
		StampQueue,
		true,  // durable
		false, // delete when unused
		false, // exclusive
		false, // no-wait
		nil,
	)
	if err == nil {
		_ = ch.QueueBind(
			q.Name,
			StampRouting,
			ExchangeName,
			false,
			nil,
		)
	}

	b.conn = conn
	b.channel = ch
	b.isOnline = true
	metrics.RabbitMQConnected.Set(1)
	log.Println("RabbitMQ connected successfully. Queue and Exchange initialized.")
}

func (b *EventBus) PublishStampEvent(ctx context.Context, evt StampEvent) {
	evt.EventID = uuid.New()
	evt.Timestamp = time.Now()

	data, err := json.Marshal(evt)
	if err != nil {
		log.Printf("Error marshalling stamp event: %v", err)
		metrics.EventsPublishedTotal.WithLabelValues(evt.Type, "error").Inc()
		return
	}

	b.mu.Lock()
	defer b.mu.Unlock()

	if !b.isOnline || b.channel == nil {
		log.Printf("[Local Event Bus] Stamp event emitted: %s for card %s (stamps: %d)", evt.Type, evt.CardID, evt.StampsCurrent)
		metrics.EventsPublishedTotal.WithLabelValues(evt.Type, "local_mock").Inc()
		return
	}

	routingKey := "alpacard.stamp." + evt.Type
	err = b.channel.PublishWithContext(
		ctx,
		ExchangeName,
		routingKey,
		false, // mandatory
		false, // immediate
		amqp.Publishing{
			ContentType:  "application/json",
			DeliveryMode: amqp.Persistent,
			Timestamp:    time.Now(),
			Body:         data,
		},
	)

	if err != nil {
		log.Printf("Failed to publish RabbitMQ event: %v", err)
		metrics.EventsPublishedTotal.WithLabelValues(evt.Type, "error").Inc()
	} else {
		log.Printf("[RabbitMQ] Published event %s to %s", evt.Type, routingKey)
		metrics.EventsPublishedTotal.WithLabelValues(evt.Type, "success").Inc()
	}
}

func (b *EventBus) Close() {
	b.mu.Lock()
	defer b.mu.Unlock()

	metrics.RabbitMQConnected.Set(0)
	if b.channel != nil {
		_ = b.channel.Close()
	}
	if b.conn != nil {
		_ = b.conn.Close()
	}
}
