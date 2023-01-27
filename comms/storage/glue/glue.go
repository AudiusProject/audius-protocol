// Package glue contains an implementation of each component that storage node needs - like the dependency graph of an adapter for each port (in the ports and adapters pattern).
package glue

import (
	"comms.audius.co/storage/decider"
	"comms.audius.co/storage/jobs/jobsmanager"
	"github.com/nats-io/nats.go"
)

// TODO: Node belongs somewhere else, probably grouped together with bucketing logic

type NodeStatus string

const (
	NodeStatusOk           NodeStatus = "ok"
	NodeStatusDraining     NodeStatus = "draining"
	NodeStatusDeregistered NodeStatus = "deregistered"
)

type Node struct {
	Status NodeStatus `json:"status"`
}

type Glue struct {
	Namespace      string
	StorageDecider decider.StorageDecider
	JobsManager    jobsmanager.JobsManager
	Jsc            nats.JetStreamContext
}

// New creates the default Glue that is used in the main package.
func NewProdGlue(namespace string, replicaCount int, jsc nats.JetStreamContext) (*Glue, error) {
	storageDecider := decider.NewRendezvousDecider(namespace, replicaCount, jsc)
	jobsManager, err := jobsmanager.New(namespace, jsc, 1, 3)
	if err != nil {
		return nil, err
	}
	return NewCustomGlue(namespace, storageDecider, jobsManager, jsc), nil
}

// NewCustom creates a Glue with a custom dependency graph of the provided args.
func NewCustomGlue(namespace string, storageDecider decider.StorageDecider, jobsManager jobsmanager.JobsManager, jsc nats.JetStreamContext) *Glue {
	return &Glue{Namespace: namespace, StorageDecider: storageDecider, JobsManager: jobsManager, Jsc: jsc}
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
