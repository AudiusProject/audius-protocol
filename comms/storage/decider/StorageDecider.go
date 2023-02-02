// Package decider decides which IDs this node should store.
package decider

import (
	"time"

	"github.com/nats-io/nats.go"
)

const objStoreTtl = time.Hour * 24

type StorageDecider interface {
	// ShouldStore returns true if this node should store the content with ID id.
	ShouldStore(id string) bool

	// OnChange finds content that needs to be stored or deleted and fetches or deletes it.
	OnChange(prevBuckets []string, curBuckets []string) error

	// GetTempStoreFor returns the object store that should be used to temporarily store raw or transcoded content that either has ID bucketOrId or is in the bucket bucketOrId.
	GetTempStoreFor(bucketOrId string) (nats.ObjectStore, error)
}

// NaiveDecider is a storage decider that stores everything.
type NaiveDecider struct {
	namespace string
	jsc       nats.JetStreamContext
}

// NewNaiveDecider creates a storage decider that makes this node store all content.
func NewNaiveDecider(namespace string, jsc nats.JetStreamContext) *NaiveDecider {
	return &NaiveDecider{namespace: namespace, jsc: jsc}
}

func (d *NaiveDecider) ShouldStore(id string) bool {
	return true
}

func (d *NaiveDecider) OnChange(prevBuckets []string, curBuckets []string) error {
	return nil
}

func (d *NaiveDecider) GetTempStoreFor(bucketOrId string) (nats.ObjectStore, error) {
	// No sharding for naive decider - store it all in one bucket.
	return d.jsc.CreateObjectStore(&nats.ObjectStoreConfig{
		Bucket: d.namespace + "_store",
		TTL:    objStoreTtl,
	})
}
