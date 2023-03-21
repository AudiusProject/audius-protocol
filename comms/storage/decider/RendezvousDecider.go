// Package decider decides which IDs this node should store.
package decider

import (
	"encoding/json"
	"fmt"
	"log"
	"strings"

	"comms.audius.co/storage/config"
	"comms.audius.co/storage/logstream"
	"comms.audius.co/storage/sharder"
	"github.com/nats-io/nats.go"
	"github.com/tysonmote/rendezvous"
)

// RendezvousDecider is a storage decider that stores content based on a rendezvous hash.
type RendezvousDecider struct {
	namespace          string
	replicationFactor  int
	healthyNodePubKeys []string
	thisNodePubKey     string
	sharder            *sharder.Sharder
	ShardsStored       []string
	logstream          *logstream.LogStream
	jsc                nats.JetStreamContext
}

// NewRendezvousDecider creates a storage decider that makes this node store content based on a rendezvous hash.
func NewRendezvousDecider(
	namespace string,
	replicationFactor int,
	thisNodePubKey string,
	healthyNodesKV nats.KeyValue,
	logstream *logstream.LogStream,
	jsc nats.JetStreamContext,
) *RendezvousDecider {
	var healthyNodePubKeys []string
	// Ignore errors - this KV isn't set until the first node is added to the network.
	healthyNodePubKeysEntry, err := healthyNodesKV.Get(namespace)
	if err == nil {
		err = json.Unmarshal(healthyNodePubKeysEntry.Value(), &healthyNodePubKeys)
		if err != nil {
			log.Print("error: invalid healthyNodes KV value: " + string(healthyNodePubKeysEntry.Value()))
		}
	}
	d := RendezvousDecider{
		namespace:          namespace,
		replicationFactor:  replicationFactor,
		healthyNodePubKeys: healthyNodePubKeys,
		thisNodePubKey:     thisNodePubKey,
		sharder:            sharder.New(config.GetStorageConfig().ShardLength),
		logstream:          logstream,
		jsc:                jsc,
	}
	d.ShardsStored = d.computeShardsNodeStores()
	d.watchForNewHealthyNodeSet(healthyNodesKV)
	return &d
}

// ShouldStore returns true if this node is responsible for storing the shard that the content with ID id falls into.
func (d RendezvousDecider) ShouldStore(id string) (bool, error) {
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

func (d RendezvousDecider) GetNamespacedShardForID(id string) (string, error) {
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
func (d RendezvousDecider) computeShardsNodeStores() []string {
	shards := []string{}
	hash := d.getRendezvousHash()
	for _, shard := range d.sharder.Shards {
		for _, pubKeyThatStores := range hash.GetN(d.replicationFactor, shard) {
			if strings.EqualFold(pubKeyThatStores, d.thisNodePubKey) {
				shards = append(shards, shard)
			}
		}
	}

	return shards
}

// getRendezvousHash returns a data structure that spreads storage across all allStorageNodePubKeys in the network.
// Uses rendezvous/highest random weight hashing.
func (d RendezvousDecider) getRendezvousHash() *rendezvous.Hash {
	hash := rendezvous.New()
	for _, publicKey := range d.healthyNodePubKeys {
		hash.Add(publicKey)
	}
	return hash
}

func (d *RendezvousDecider) watchForNewHealthyNodeSet(kv nats.KeyValue) {
	watcher, err := kv.Watch(d.namespace)
	if err != nil {
		log.Fatal("failed to watch for changes to set of healthy nodes: ", err)
	}

	go func() {
		for change := range watcher.Updates() {
			if change == nil {
				continue
			}

			// Read latest set of healthy nodes
			var healthyNodePubKeys []string
			err := json.Unmarshal(change.Value(), &healthyNodePubKeys)
			if err != nil {
				log.Print("error: invalid healthyNodes KV value: " + string(change.Value()))
				continue
			}

			// Update this node's view of the set of healthy nodes to match the latest
			prevShards := d.ShardsStored
			d.healthyNodePubKeys = healthyNodePubKeys
			d.ShardsStored = d.computeShardsNodeStores()
			curShards := d.ShardsStored
			d.rebalanceShardsStored(prevShards, curShards)
		}
	}()
}

// rebalanaceShardsStored finds content that needs to be stored or deleted and fetches or deletes it.
func (d RendezvousDecider) rebalanceShardsStored(prevShards []string, curShards []string) error {
	d.logstream.LogRebalanceStart(prevShards, curShards)
	// TODO: find diff
	// TODO: soft delete
	// TODO: soft delete improvement: only delete if it hasn't been responsible for the shard in the past N days, so if an unhealthy node comes back up then it'll still have what it would revert to and not have to reshuffle
	// TODO: fetch
	d.logstream.LogRebalanceEnd(prevShards, curShards)
	return nil
}
