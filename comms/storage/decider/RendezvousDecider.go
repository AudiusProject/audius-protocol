// Package decider decides which IDs this node should store.
package decider

import (
	"comms.audius.co/storage/bucketer"
	"github.com/nats-io/nats.go"
	"github.com/tysonmote/rendezvous"
)

// RendezvousDecider is a storage decider that stores content based on a rendezvous hash.
type RendezvousDecider struct {
	namespace             string
	replicationFactor     int
	allStorageNodePubKeys []string
	thisNodePubKey        string
	bucketer              *bucketer.Bucketer
	BucketsStored         []string
	jsc                   nats.JetStreamContext
}

// NewRendezvousDecider creates a storage decider that makes this node store content based on a rendezvous hash.
func NewRendezvousDecider(namespace string, replicationFactor int, allStorageNodePubKeys []string, thisNodePubKey string, jsc nats.JetStreamContext) *RendezvousDecider {
	d := RendezvousDecider{
		namespace:             namespace,
		replicationFactor:     replicationFactor,
		allStorageNodePubKeys: allStorageNodePubKeys,
		thisNodePubKey:        thisNodePubKey,
		bucketer:              bucketer.New(2),
		jsc:                   jsc,
	}
	d.BucketsStored = d.computeBucketsNodeStores(thisNodePubKey)
	return &d
}

// ShouldStore returns true if this node is responsible for storing the bucket that the content with ID id falls into.
func (d *RendezvousDecider) ShouldStore(id string) bool {
	for _, bucket := range d.BucketsStored {
		if d.bucketer.GetBucketForId(id) == bucket {
			return true
		}
	}
	return false
}

func (d *RendezvousDecider) OnChange(prevBuckets []string, curBuckets []string) error {
	// TODO: find diff
	// TODO: soft delete
	// TODO: fetch
	return nil
}

// computeBucketsNodeStores determines the buckets that this node is responsible for storing based on all nodes in the storage network.
func (d *RendezvousDecider) computeBucketsNodeStores(publicKey string) []string {
	buckets := []string{}
	hash := d.getHashRing()
	for _, bucket := range d.bucketer.Buckets {
		for _, pubKeyThatStores := range hash.GetN(d.replicationFactor, bucket) {
			if pubKeyThatStores == d.thisNodePubKey {
				buckets = append(buckets, bucket)
			}
		}
	}
	return buckets
}

// getHashRing returns a data structure that spreads storage across all allStorageNodePubKeys in the network.
// N.b. this implementation currently uses rendezvous/highest random weight hashing so it's not technically a ring.
func (d *RendezvousDecider) getHashRing() *rendezvous.Hash {
	hash := rendezvous.New()
	for _, publicKey := range d.allStorageNodePubKeys {
		hash.Add(publicKey)
	}
	return hash
}
