package server

import (
	"time"

	"github.com/tysonmote/rendezvous"
	"golang.org/x/exp/slices"
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

// todo: use `rendezvous` everywhere instead?
func (p *placement) topAll(h string) []Peer {
	topN := p.hashRing.GetN(len(p.peerMap), h)
	peers := make([]Peer, len(topN))
	for idx, k := range topN {
		peers[idx] = p.peerMap[k]
	}
	return peers
}

func (ss *MediorumServer) rendezvous(h string) ([]string, bool) {
	hosts := ss.findHealthyPeers(5 * time.Minute)
	hashRing := rendezvous.New()
	for _, host := range hosts {
		hashRing.Add(host)
	}
	orderedHosts := hashRing.GetN(len(hosts), h)
	isMine := slices.Index(orderedHosts, ss.Config.Self.Host) < ss.Config.ReplicationFactor // || ss.Config.FullNode
	return orderedHosts, isMine
}
