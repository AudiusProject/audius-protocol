package config

import (
	shared "comms.audius.co/shared/config"
)

type NatsConfig struct {
	PeeringConfig shared.PeeringConfig `json:"PeeringConfig"`
}

var natsConfig *NatsConfig

// GetDiscoveryConfig returns the discovery config by parsing env vars.
func GetNatsConfig() *NatsConfig {
	if natsConfig == nil {
		natsConfig = &NatsConfig{}
		shared.EnsurePrivKeyAndLoadConf(natsConfig)
	}
	return natsConfig
}
