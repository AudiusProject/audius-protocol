package config

import (
	"github.com/nats-io/nats.go"
)

func StoragePlacement() *nats.Placement {
	return &nats.Placement{
		Cluster: GetStorageConfig().PeeringConfig.NatsClusterName,
		Tags:    []string{"type:content-node"},
	}
}
