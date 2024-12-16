// A generic pubsub system built with go channels. Used to communicate different pieces of data across the app.
// Latest block, stream txs, etc.
package server

import (
	"context"
	"sync"
)

// subscribes by tx hash, pubsub completes once tx
// is committed
type TransactionHashPubsub = Pubsub[struct{}]

type Pubsub[Message any] struct {
	subscribers map[string]map[chan Message]struct{} // Map of topic to channels
	mu          sync.RWMutex
}

func NewPubsub[Message any]() *Pubsub[Message] {
	return &Pubsub[Message]{
		subscribers: make(map[string]map[chan Message]struct{}),
	}
}

// Subscribe subscribes to a specific topic and returns a channel to receive messages.
func (ps *Pubsub[Message]) Subscribe(topic string, bufferSizes ...int) chan Message {
	ps.mu.Lock()
	defer ps.mu.Unlock()

	bufferSize := 1
	if len(bufferSizes) > 0 {
		bufferSize = bufferSizes[0]
	}

	ch := make(chan Message, bufferSize)
	if ps.subscribers[topic] == nil {
		ps.subscribers[topic] = make(map[chan Message]struct{})
	}
	ps.subscribers[topic][ch] = struct{}{}
	return ch
}

// Unsubscribe removes a subscriber from a topic and closes the channel.
func (ps *Pubsub[Message]) Unsubscribe(topic string, ch chan Message) {
	ps.mu.Lock()
	defer ps.mu.Unlock()

	if subs, exists := ps.subscribers[topic]; exists {
		if _, ok := subs[ch]; ok {
			delete(subs, ch)
			close(ch)
		}

		// Clean up the topic if no subscribers remain
		if len(subs) == 0 {
			delete(ps.subscribers, topic)
		}
	}
}

// Publish sends a message to all subscribers of the specified topic
func (ps *Pubsub[Message]) Publish(ctx context.Context, topic string, msg Message) {
	ps.mu.RLock()
	defer ps.mu.RUnlock()

	// Helper function to send messages to a topic
	publishToTopic := func(topic string) {
		if subs, exists := ps.subscribers[topic]; exists {
			for ch := range subs {
				go func(ch chan Message) {
					select {
					case ch <- msg:
						// Message sent successfully
					default:
						// Subscriber is not ready, drop the message
					}
				}(ch)
			}
		}
	}
	publishToTopic(topic)
}
