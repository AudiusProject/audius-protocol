package config

import (
	shared "comms.audius.co/shared/config"
)

var discoveryConfig *DiscoveryConfig

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
