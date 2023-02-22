package config

import (
	"os"

	shared "comms.audius.co/shared/config"
)

var (
	// TODO: Consolidate - peering also has this. Maybe they should be hardcoded constants outside of peering
	NatsReplicaCount = 3
	NatsIsReachable  = false

	discoveryConfig *DiscoveryConfig
)

type DiscoveryConfig struct {
	PeeringConfig shared.PeeringConfig `json:"PeeringConfig"`
}

// GetDiscoveryConfig returns the discovery config by parsing env vars.
func GetDiscoveryConfig() *DiscoveryConfig {
	if discoveryConfig == nil {
		discoveryConfig = &DiscoveryConfig{}
		shared.EnsurePrivKeyAndLoadConf(discoveryConfig)
	}
	return discoveryConfig
}

func GetEnvDefault(k, defaultV string) string {
	v := os.Getenv(k)
	if len(v) == 0 {
		return defaultV
	}
	return v
}
