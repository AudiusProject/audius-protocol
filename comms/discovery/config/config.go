package config

import (
	"os"
)

var discoveryConfig *DiscoveryConfig

type DiscoveryConfig struct {
	// PeeringConfig shared.PeeringConfig `json:"PeeringConfig"`

	MyHost       string
	MyWallet     string
	MyPrivateKey string `json:"-"`
	IsStaging    bool
}

// GetDiscoveryConfig returns the discovery config by parsing env vars.
func GetDiscoveryConfig() *DiscoveryConfig {
	if discoveryConfig == nil {
		discoveryConfig = &DiscoveryConfig{}

		discoveryConfig.MyPrivateKey = os.Getenv("audius_delegate_private_key")
		discoveryConfig.MyWallet = os.Getenv("audius_delegate_owner_wallet")
		discoveryConfig.MyHost = os.Getenv("audius_discprov_url")
		discoveryConfig.IsStaging = os.Getenv("AUDIUS_IS_STAGING") == "true"

		// shared.EnsurePrivKeyAndLoadConf(discoveryConfig)

	}
	return discoveryConfig
}
