package config

import (
	sharedConfig "comms.audius.co/shared/config"
)

type NatsConfig struct {
	Keys sharedConfig.KeysConfigDecoder `envconfig:"DELEGATE_PRIVATE_KEY" required:"true" json:"Keys"`
}

var natsConfig *NatsConfig

// GetDiscoveryConfig returns the discovery config by parsing env vars.
func GetNatsConfig() *NatsConfig {
	if natsConfig == nil {
		natsConfig = &NatsConfig{}
		sharedConfig.EnsurePrivKeyAndLoadConf(natsConfig)
	}
	return natsConfig
}
