package config

import (
	"os"

	shared "comms.audius.co/shared/config"
)

type NatsConfig struct {
	PeeringConfig shared.PeeringConfig `json:"PeeringConfig"`
	IsStorageNode bool                 `envconfig:"AUDIUS_IS_STORAGE_NODE" json:"IsStorageNode"`
}

var natsConfig *NatsConfig

// GetDiscoveryConfig returns the discovery config by parsing env vars.
func GetNatsConfig() *NatsConfig {
	if natsConfig == nil {
		// Only creator nodes have a delegate owner wallet. Necessary hack because prod nodes won't all set `AUDIUS_IS_STORAGE_NODE`
		if os.Getenv("delegateOwnerWallet") != "" {
			os.Setenv("AUDIUS_IS_STORAGE_NODE", "true")
		}

		natsConfig = &NatsConfig{}
		shared.EnsurePrivKeyAndLoadConf(natsConfig)
	}
	return natsConfig
}
