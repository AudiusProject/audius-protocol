// Package config provides the configuration for the storage node by reading env vars.
package config

import (
	shared "comms.audius.co/shared/config"
)

type StorageConfig struct {
	Keys                   shared.KeysConfigDecoder   `envconfig:"DELEGATE_PRIVATE_KEY" required:"true" json:"Keys"`
	StorageDriverUrl       string                     `envconfig:"STORAGE_DRIVER_URL" default:"file:///tmp/audius_storage" json:"StorageDriverUrl"`
	DevOnlyRegisteredNodes shared.ServiceNodesDecoder `envconfig:"DEV_ONLY_REGISTERED_NODES" json:"DevOnlyRegisteredNodes"`
}

var storageConfig *StorageConfig

// GetStorageConfig returns the storage config by parsing env vars.
func GetStorageConfig() *StorageConfig {
	if storageConfig == nil {
		storageConfig = &StorageConfig{}
		shared.EnsurePrivKeyAndLoadConf(storageConfig)
	}
	return storageConfig
}
