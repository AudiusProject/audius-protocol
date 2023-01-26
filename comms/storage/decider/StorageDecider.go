// Package decider decides which IDs this node should store.
package decider

import "github.com/nats-io/nats.go"

type StorageDecider interface {
	// ShouldStore returns true if this node should store the content with ID id.
	ShouldStore(id string) (bool, error)

	// OnChange finds content that needs to be stored or deleted and fetches or deletes it.
	OnChange(prevBuckets []string, curBuckets []string) error
}

// NaiveDecider is a storage decider that stores everything.
type NaiveDecider struct{}

// NewNaiveDecider creates a storage decider that makes this node store all content.
func NewNaiveDecider() *NaiveDecider {
	return &NaiveDecider{}
}

func (d *NaiveDecider) ShouldStore(id string) (bool, error) {
	return true, nil
}

func (d *NaiveDecider) OnChange(prevBuckets []string, curBuckets []string) error {
	return nil
}

// RendezvousDecider is a storage decider that stores content based on a rendezvous hash.
type RendezvousDecider struct {
	namespace         string
	replicationFactor int
	jsc               nats.JetStreamContext
}

// NewRendezvousDecider creates a storage decider that makes this node store content based on a rendezvous hash.
func NewRendezvousDecider(namespace string, replicationFactor int, jsc nats.JetStreamContext) *RendezvousDecider {
	return &RendezvousDecider{namespace: namespace, replicationFactor: replicationFactor, jsc: jsc}
}

func (d *RendezvousDecider) ShouldStore(id string) (bool, error) {
	// TODO
	return true, nil
}

func (d *RendezvousDecider) OnChange(prevBuckets []string, curBuckets []string) error {
	// TODO: find diff
	// TODO: soft delete
	// TODO: fetch
	return nil
}
