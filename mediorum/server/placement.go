package server

import (
	"time"

	"github.com/tysonmote/rendezvous"
	"golang.org/x/exp/slices"
)

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
