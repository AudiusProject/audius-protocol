package registrar

import "mediorum/server"

type staticProvider struct {
	peers   []server.Peer
	signers []server.Peer
}

func NewStatic(peers, signers []server.Peer) PeerProvider {
	return &staticProvider{peers, signers}
}

func (p *staticProvider) Peers() ([]server.Peer, error) {
	return p.peers, nil
}

func (p *staticProvider) Signers() ([]server.Peer, error) {
	return p.signers, nil
}
