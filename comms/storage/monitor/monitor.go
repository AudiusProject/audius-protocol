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

type HostAndBuckets struct {
	Host    string   `json:"host"`
	Buckets []string `json:"buckets"`
}

func New(jsc nats.JetStreamContext) *Monitor {
	// Create KV store for each node to set its endpoint and the list of buckets it stores
	kv, err := jsc.KeyValue("nodes_monitoring")
	if err == nats.ErrBucketNotFound || err == nats.ErrStreamNotFound {
		kv, err = jsc.CreateKeyValue(&nats.KeyValueConfig{
			Bucket:      "nodes_monitoring",
			Description: "KV store for each node to set its endpoint and the list of buckets it stores",
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

func (m *Monitor) GetNodesToBuckets() (map[string]HostAndBuckets, error) {
	nodesToBuckets := make(map[string]HostAndBuckets)

	pubKeys, err := m.kv.Keys()
	if err != nil {
		return nil, err
	}
	for _, pubKey := range pubKeys {
		hostAndBuckets := HostAndBuckets{}
		entry, err := m.kv.Get(pubKey)
		if err != nil {
			return nil, err
		}
		err = json.Unmarshal(entry.Value(), &hostAndBuckets)
		if err != nil {
			return nil, err
		}
		nodesToBuckets[pubKey] = hostAndBuckets
	}

	return nodesToBuckets, nil
}

func (m *Monitor) SetHostAndBucketsForNode(nodePubKey, host string, buckets []string) error {
	data, err := json.Marshal(HostAndBuckets{
		Host:    host,
		Buckets: buckets,
	})
	if err != nil {
		return err
	}
	_, err = m.kv.Put(nodePubKey, data)
	return err
}
