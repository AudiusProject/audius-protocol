// Package monitor provides a way to sync up each node's state to NATS so that any node can query the state of any other node.
package monitor

import (
	"encoding/json"
	"log"

	"github.com/nats-io/nats.go"
)

type Monitor struct {
	jsc nats.JetStreamContext
	kv  nats.KeyValue
}

type HostAndShards struct {
	Host   string   `json:"host"`
	Shards []string `json:"shards"`
}

func New(jsc nats.JetStreamContext) *Monitor {
	// Create KV store for each node to set its endpoint and the list of shards it stores
	kv, err := jsc.KeyValue("nodes_monitoring")
	if err == nats.ErrBucketNotFound || err == nats.ErrStreamNotFound {
		kv, err = jsc.CreateKeyValue(&nats.KeyValueConfig{
			Bucket:      "nodes_monitoring",
			Description: "KV store for each node to set its endpoint and the list of shards it stores",
		})
		if err != nil {
			log.Fatalf("Failed to create-if-not-exists monitoring KV store: %v", err)
		}
	} else if err != nil {
		log.Fatalf("Failed to create-if-not-exists monitoring KV store: %v", err)
	}

	return &Monitor{
		jsc: jsc,
		kv:  kv,
	}
}

func (m *Monitor) GetNodesToShards() (map[string]HostAndShards, error) {
	nodesToShards := make(map[string]HostAndShards)

	pubKeys, err := m.kv.Keys()
	if err != nil {
		return nil, err
	}
	for _, pubKey := range pubKeys {
		hostAndShards := HostAndShards{}
		entry, err := m.kv.Get(pubKey)
		if err != nil {
			return nil, err
		}
		err = json.Unmarshal(entry.Value(), &hostAndShards)
		if err != nil {
			return nil, err
		}
		nodesToShards[pubKey] = hostAndShards
	}

	return nodesToShards, nil
}

func (m *Monitor) SetHostAndShardsForNode(nodePubKey, host string, shards []string) error {
	data, err := json.Marshal(HostAndShards{
		Host:   host,
		Shards: shards,
	})
	if err != nil {
		return err
	}
	_, err = m.kv.Put(nodePubKey, data)
	return err
}
