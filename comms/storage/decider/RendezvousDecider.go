// Package decider decides which IDs this node should store.
package decider

import (
	"fmt"

	"comms.audius.co/shared/peering"
	"comms.audius.co/storage/sharder"
	"github.com/nats-io/nats.go"
	"github.com/tysonmote/rendezvous"
)

// RendezvousDecider is a storage decider that stores content based on a rendezvous hash.
type RendezvousDecider struct {
	namespace             string
	replicationFactor     int
	allStorageNodePubKeys []string
	thisNodePubKey        string
	sharder               *sharder.Sharder
	ShardsStored          []string
	jsc                   nats.JetStreamContext
}

// NewRendezvousDecider creates a storage decider that makes this node store content based on a rendezvous hash.
func NewRendezvousDecider(namespace string, replicationFactor int, thisNodePubKey string, jsc nats.JetStreamContext) *RendezvousDecider {
	var allStorageNodePubKeys []string
	allNodes, _ := peering.GetContentNodes()
	for _, v := range allNodes {
		allStorageNodePubKeys = append(allStorageNodePubKeys, v.DelegateOwnerWallet)
	}

	d := RendezvousDecider{
		namespace:             namespace,
		replicationFactor:     replicationFactor,
		allStorageNodePubKeys: allStorageNodePubKeys,
		thisNodePubKey:        thisNodePubKey,
		sharder:               sharder.New(2),
		jsc:                   jsc,
	}
	d.ShardsStored = d.computeShardsNodeStores(thisNodePubKey)
	return &d
}

// ShouldStore returns true if this node is responsible for storing the shard that the content with ID id falls into.
func (d *RendezvousDecider) ShouldStore(id string) (bool, error) {
	for _, shardNodeStores := range d.ShardsStored {
		shardForId, err := d.sharder.GetShardForId(id)
		if err != nil {
			return false, fmt.Errorf("could not parse shard for id %q: %v", id, err)
		}
		if shardForId == shardNodeStores {
			return true, nil
		}
	}
	return false, nil
}

func (d *RendezvousDecider) OnChange(prevShards []string, curShards []string) error {
	// TODO: find diff
	// TODO: soft delete
	// TODO: fetch
	return nil
}

func (d *RendezvousDecider) GetNamespacedShardForID(id string) (string, error) {
	if len(id) != 25 {
		return "", fmt.Errorf("id %q is not a valid base36 cuid2 with 25 characters", id)
	}
	shard, err := d.sharder.GetShardForId(id)
	if err != nil {
		return "", fmt.Errorf("%q is in the form of job ID (cuid) but could not be parsed into a shard: %v", id, err)
	}
	return d.namespace + "_" + shard, nil
}

// computeShardsNodeStores determines the shards that this node is responsible for storing based on all nodes in the storage network.
func (d *RendezvousDecider) computeShardsNodeStores(publicKey string) []string {
	shards := []string{}
	hash := d.getHashRing()
	for _, shard := range d.sharder.Shards {
		for _, pubKeyThatStores := range hash.GetN(d.replicationFactor, shard) {
			if pubKeyThatStores == d.thisNodePubKey {
				shards = append(shards, shard)
			}
		}
	}

	return shards
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
