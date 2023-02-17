package peering

import sharedConfig "comms.audius.co/shared/config"

type Peering struct {
	Config *sharedConfig.PeeringConfig
}

func New(config *sharedConfig.PeeringConfig) *Peering {
	return &Peering{Config: config}
}
