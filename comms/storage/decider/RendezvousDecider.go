// Package decider decides which IDs this node should store.
package decider

import (
	"fmt"
	"strings"

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
	d.BucketsStored = d.computeAndCreateBucketsNodeStores(thisNodePubKey)
	return &d
}

// ShouldStore returns true if this node is responsible for storing the bucket that the content with ID id falls into.
func (d *RendezvousDecider) ShouldStore(id string) (bool, error) {
	for _, shardNodeStores := range d.BucketsStored {
		shardForId, err := d.bucketer.GetBucketForId(id)
		if err != nil {
			return false, fmt.Errorf("could not parse bucket for id %q: %v", id, err)
		}
		if shardForId == shardNodeStores {
			return true, nil
		}
	}
	return false, nil
}

func (d *RendezvousDecider) OnChange(prevBuckets []string, curBuckets []string) error {
	// TODO: find diff
	// TODO: soft delete
	// TODO: fetch
	return nil
}

func (d *RendezvousDecider) GetNamespacedShardFor(any string) (string, error) {
	var shard string
	var err error
	if d.bucketer.SuffixLength == len(any) {
		// Case 1: any is a (non namespaced) shard of 2 characters
		shard = any
	} else {
		// Case 2: any is a file name (a string that ends with <cuid>_<string>.<extension>)
		// Check if shard contains a period
		if idx := strings.LastIndex(any, "_"); idx != -1 {
			cuid := any[:idx]
			if len(cuid) == 25 {
				shard, err = d.bucketer.GetBucketForId(cuid)
				if err != nil {
					return "", fmt.Errorf("%q is in the form of fileName but could not be parsed into a shard: %v", any, err)
				}
			}
		} else if len(any) == 25 {
			// Case 3: any is a job ID (cuid)
			shard, err = d.bucketer.GetBucketForId(any)
			if err != nil {
				return "", fmt.Errorf("%q is in the form of job ID (cuid) but could not be parsed into a shard: %v", any, err)
			}
		}
	}
	if shard == "" {
		return "", fmt.Errorf("could not parse shard from %q", any)
	}
	return fmt.Sprintf("%s_%s", d.namespace, shard), nil
}

// computeBucketsNodeStores determines the buckets that this node is responsible for storing based on all nodes in the storage network.
func (d *RendezvousDecider) computeAndCreateBucketsNodeStores(publicKey string) []string {
	// Compute buckets
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
