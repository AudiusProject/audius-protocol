package config

import "github.com/nats-io/nats.go"

func DiscoveryPlacement() *nats.Placement {
	if NatsReplicaCount == 1 {
		return nil
	}

	return &nats.Placement{
		Cluster: NatsClusterName,
		Tags:    []string{"discovery"},
	}
}
