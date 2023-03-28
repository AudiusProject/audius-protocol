package config

import (
	"os"
)

type DiscoveryConfig struct {
	MyHost       string
	MyWallet     string
	MyPrivateKey string `json:"-"`
	IsStaging    bool
}

// Parse returns the discovery config by parsing env vars.
func Parse() *DiscoveryConfig {
	discoveryConfig := &DiscoveryConfig{}

	discoveryConfig.MyPrivateKey = os.Getenv("audius_delegate_private_key")
	discoveryConfig.MyWallet = os.Getenv("audius_delegate_owner_wallet")
	discoveryConfig.MyHost = os.Getenv("audius_discprov_url")
	discoveryConfig.IsStaging = os.Getenv("AUDIUS_IS_STAGING") == "true"

	return discoveryConfig
}
