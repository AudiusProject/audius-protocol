// Package decider decides which IDs this node should store.
package decider

import (
	"github.com/nats-io/nats.go"
)

type StorageDecider interface {
	// ShouldStore returns true if this node should store the content with ID id.
	ShouldStore(id string) (bool, error)

	// GetShardForID returns the shard, prefixed with "<namespace>_", for the given id (a base36 cuid).
	GetNamespacedShardForID(id string) (string, error)
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

func (d *NaiveDecider) GetNamespacedShardForID(_ string) (string, error) {
	return d.namespace + "_naive-shard", nil
}
