package peering

var registeredNodesOverride []ServiceNode

func New(registeredNodes []ServiceNode) {
	registeredNodesOverride = registeredNodes
}
