// Package glue connects everything through streams and listeners.
package glue

type NodeStatus string

const (
	NodeStatusOk           NodeStatus = "ok"
	NodeStatusDraining     NodeStatus = "draining"
	NodeStatusDeregistered NodeStatus = "deregistered"
)

type Node struct {
	Status string `json:"status"`
}

// CreateNamespace creates a KV bucket for namespace.
// The bucket contains a mapping of <node operater wallet address> -> Node.
func CreateNamespace(namespace string) error {
	// TODO
	return nil
}

// CreateOrUpdateNode creates or updates the value of node for walletAddress in namespace.
func CreateOrUpdateNode(namespace string, walletAddress string, node Node) error {
	// TODO
	return nil
}
