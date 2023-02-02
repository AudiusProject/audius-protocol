// Package decider decides which IDs this node should store.
package decider

import (
	"log"
	"time"

	"github.com/nats-io/nats.go"
)

const objStoreTtl = time.Hour * 24

type StorageDecider interface {
	// ShouldStore returns true if this node should store the content with ID id.
	ShouldStore(id string) bool

	// OnChange finds content that needs to be stored or deleted and fetches or deletes it.
	OnChange(prevBuckets []string, curBuckets []string) error

	// GetNamespacedBucketFor returns the bucket for both temp and long-term storage for the given (non-namespaced) bucket or content ID.
	GetNamespacedBucketFor(idOrNonNamespacedBucket string) string
}

// NaiveDecider is a storage decider that stores everything.
type NaiveDecider struct {
	namespace string
	jsc       nats.JetStreamContext
}

// NewNaiveDecider creates a storage decider that makes this node store all content.
func NewNaiveDecider(namespace string, jsc nats.JetStreamContext) *NaiveDecider {
	d := &NaiveDecider{namespace: namespace, jsc: jsc}

	// Pre-create single bucket for naive decider - no sharding
	createObjStoreIfNotExists(&nats.ObjectStoreConfig{
		Bucket:      d.GetNamespacedBucketFor(""),
		Description: "Temp object store for all files (non-sharded, naive StorageDecider)",
		TTL:         objStoreTtl,
	}, jsc)

	return d
}

func (d *NaiveDecider) ShouldStore(id string) bool {
	return true
}

func (d *NaiveDecider) OnChange(prevBuckets []string, curBuckets []string) error {
	return nil
}

func (d *NaiveDecider) GetNamespacedBucketFor(_ string) string {
	return d.namespace + "_naive-bucket"
}

func createObjStoreIfNotExists(cfg *nats.ObjectStoreConfig, jsc nats.JetStreamContext) {
	_, err := jsc.ObjectStore(cfg.Bucket)
	if err == nats.ErrBucketNotFound || err == nats.ErrStreamNotFound {
		_, err = jsc.CreateObjectStore(cfg)
		if err != nil {
			log.Fatalf("Failed to create-if-not-exists object store %q: %v", cfg.Bucket, err)
		}
	} else if err != nil {
		log.Fatalf("Failed to create-if-not-exists object store %q: %v", cfg.Bucket, err)
	}
}
