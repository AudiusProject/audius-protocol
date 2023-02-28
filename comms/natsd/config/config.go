package config

import (
	"os"

	shared "comms.audius.co/shared/config"
)

type NatsConfig struct {
	PeeringConfig   shared.PeeringConfig `json:"PeeringConfig"`
	EnableJetstream bool                 `envconfig:"AUDIUS_NATS_ENABLE_JETSTREAM" default:"false" json:"EnableJetstream"`
	StoreDir        string               `envconfig:"AUDIUS_NATS_STORE_DIR" default:"/nats" json:"StoreDir"`
	// TODO: should this be here?
	// ObjStorePlacementTags []string             `envconfig:"AUDIUS_NATS_OBJ_STORE_PLACEMENT_TAGS" default:"type:content-node" json:"ObjStorePlacementTags"`
}

var natsConfig *NatsConfig

// GetNatsConfig returns the nats config by parsing env vars.
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
