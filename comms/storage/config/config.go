// Package config provides the configuration for the storage node by reading env vars.
package config

import (
	shared "comms.audius.co/shared/config"
)

type StorageConfig struct {
	PeeringConfig           shared.PeeringConfig `json:"peeringConfig"`
	StorageDriverUrl        string               `envconfig:"AUDIUS_STORAGE_DRIVER_URL" default:"file:///tmp/audius_storage" json:"storageDriverUrl"`
	ReportOKIntervalSeconds int                  `envconfig:"AUDIUS_REPORT_OK_INTERVAL_SECONDS" default:"120" json:"reportOkIntervalSeconds"`
	RebalanceIntervalHours  float64              `envconfig:"AUDIUS_REBALANCE_INTERVAL_HOURS" default:"24" json:"rebalanceIntervalHours"`
	HealthTTLHours          float64              `envconfig:"AUDIUS_HEALTH_TTL_HOURS" default:"24" json:"healthTtlHours"`
	ShardLength             int                  `envconfig:"AUDIUS_SHARD_LENGTH" default:"2" json:"shardLength"`
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
