// Package decider decides which IDs this node should store.
package decider

import (
	"time"

	"github.com/nats-io/nats.go"
)

const objStoreTtl = time.Hour * 24

type StorageDecider interface {
	// ShouldStore returns true if this node should store the content with ID id.
	ShouldStore(id string) (bool, error)

	// OnChange finds content that needs to be stored or deleted and fetches or deletes it.
	OnChange(prevBuckets []string, curBuckets []string) error

	// GetNamespacedShardFor returns the shard for long-term storage for the given string of any of the following formats:
	// - (non-namespaced) shard: 2 characters
	// - job ID: a cuid
	// - file name: a string that ends with <cuid>_<string>.<extension>
	GetNamespacedShardFor(any string) (string, error)
}

// NaiveDecider is a storage decider that stores everything.
type NaiveDecider struct {
	namespace string
	jsc       nats.JetStreamContext
}

// NewNaiveDecider creates a storage decider that makes this node store all content.
func NewNaiveDecider(namespace string, jsc nats.JetStreamContext) *NaiveDecider {
	d := &NaiveDecider{namespace: namespace, jsc: jsc}

	return d
}

func (d *NaiveDecider) ShouldStore(id string) (bool, error) {
	return true, nil
}

func (d *NaiveDecider) OnChange(prevBuckets []string, curBuckets []string) error {
	return nil
}

func (d *NaiveDecider) GetNamespacedShardFor(_ string) (string, error) {
	return d.namespace + "_naive-shard", nil
}
