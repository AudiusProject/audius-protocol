// Package glue connects everything through streams and listeners.
package glue

import (
	"comms.audius.co/storage/decider"
	"github.com/nats-io/nats.go"
)

type NodeStatus string

const (
	NodeStatusOk           NodeStatus = "ok"
	NodeStatusDraining     NodeStatus = "draining"
	NodeStatusDeregistered NodeStatus = "deregistered"
)

type Node struct {
	Status string `json:"status"`
}

type Glue struct {
	Namespace      string
	StorageDecider decider.StorageDecider
	Jsc            nats.JetStreamContext
}

func New(namespace string, replicationFactor int, jsc nats.JetStreamContext) *Glue {
	allStorageNodePubKeys := []string{"pubkey1", "pubkey2", "pubkey3"} // TODO: get dynamically (from KV store?) and re-initialize on change
	thisNodePubKey := "pubkey1"                                        // TODO: get dynamically
	d := decider.NewRendezvousDecider(namespace, replicationFactor, allStorageNodePubKeys, thisNodePubKey, jsc)
	return &Glue{Namespace: namespace, StorageDecider: d, Jsc: jsc}
}

// CreateNamespace creates a KV bucket for namespace.
// The bucket contains a mapping of <node operater wallet address> -> Node.
func (g *Glue) CreateNamespace() error {
	// TODO
	return nil
}

// CreateOrUpdateNode creates or updates the value of node for walletAddress in namespace.
func (g *Glue) CreateOrUpdateNode(walletAddress string, node Node) error {
	// TODO
	return nil
}
