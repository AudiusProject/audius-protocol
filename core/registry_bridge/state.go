package registry_bridge

type NodeState struct {
	EthDelegateWallet string
	CometAddress      string
	Healthy           bool
}

// types may differ as this structure grows
type DiscoveryNodes = map[string]NodeState
type ContentNodes = map[string]NodeState

// in memory state for the registry bridge
// eventually persist this to chain state
type State struct {
	discoveryNodes DiscoveryNodes
	contentNodes   ContentNodes
}

func NewState() *State {
	return &State{
		discoveryNodes: make(map[string]NodeState),
		contentNodes:   make(map[string]NodeState),
	}
}
