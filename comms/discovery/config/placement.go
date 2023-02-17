package config

import "github.com/nats-io/nats.go"

func DiscoveryPlacement() *nats.Placement {
	return &nats.Placement{
		Cluster: NatsClusterName,
		Tags:    []string{"discovery"},
	}
}
