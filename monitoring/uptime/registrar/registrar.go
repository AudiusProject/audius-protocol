package registrar

type PeerProvider interface {
	Peers(nodeType string) ([]Peer, error)
}

type Peer struct {
	Host   string `json:"host"`
	Wallet string `json:"wallet"`
}
