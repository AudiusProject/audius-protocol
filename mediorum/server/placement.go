package server

import (
	"strings"

	"github.com/tysonmote/rendezvous"
)

type placement struct {
	config   MediorumConfig
	hashRing *rendezvous.Hash
	peerMap  map[string]Peer
}

func newPlacement(config MediorumConfig) *placement {

	p := &placement{
		config:   config,
		peerMap:  make(map[string]Peer, len(config.Peers)),
		hashRing: rendezvous.New(),
	}

	// todo: should actually reconstruct hashring every time
	// to handle dynamic peer list
	for _, peer := range config.Peers {
		p.peerMap[peer.Host] = peer
		p.hashRing.Add(peer.Host)
	}
	return p

}

func (p *placement) isMyHash(h string) bool {
	h = fileNameHashPrefix(h)
	topN := p.hashRing.GetN(p.config.ReplicationFactor, h)
	for _, h := range topN {
		if h == p.config.Self.Host {
			return true
		}
	}
	return false
}

func (p *placement) topAll(h string) []Peer {
	h = fileNameHashPrefix(h)
	topN := p.hashRing.GetN(len(p.peerMap), h)
	peers := make([]Peer, len(topN))
	for idx, k := range topN {
		peers[idx] = p.peerMap[k]
	}
	return peers
}

func (p *placement) topN(h string) []Peer {
	h = fileNameHashPrefix(h)
	topN := p.hashRing.GetN(p.config.ReplicationFactor, h)
	peers := make([]Peer, len(topN))
	for idx, k := range topN {
		peers[idx] = p.peerMap[k]
	}
	return peers
}

func fileNameHashPrefix(key string) string {
	if idx := strings.Index(key, "_"); idx != -1 {
		return key[:idx]
	}
	return key
}
