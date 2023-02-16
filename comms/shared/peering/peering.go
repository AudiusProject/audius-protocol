package peering

import sharedConfig "comms.audius.co/shared/config"

type Peering struct {
	registeredNodesOverride []sharedConfig.ServiceNode
}

func New(registeredNodes []sharedConfig.ServiceNode) *Peering {
	return &Peering{
		registeredNodesOverride: registeredNodes,
	}
}
