// Package config provides the configuration for the storage node by reading env vars.
package config

import (
	shared "comms.audius.co/shared/config"
)

type StorageConfig struct {
	PeeringConfig    shared.PeeringConfig `json:"PeeringConfig"`
	StorageDriverUrl string               `envconfig:"AUDIUS_STORAGE_DRIVER_URL" default:"file:///tmp/audius_storage" json:"StorageDriverUrl"`
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
