package server

import (
	"time"

	"github.com/tysonmote/rendezvous"
	"golang.org/x/exp/slices"
)

func (ss *MediorumServer) rendezvous(h string) ([]string, bool) {
	hosts := ss.findHealthyPeers(5 * time.Minute)
	hashRing := rendezvous.New(hosts...)
	orderedHosts := hashRing.GetN(len(hosts), h)
	isMine := slices.Index(orderedHosts, ss.Config.Self.Host) < ss.Config.ReplicationFactor
	if ss.Config.StoreAll {
		isMine = true
	} else if isLegacyCID(h) {
		// TODO(theo): Remove this once all nodes have enough space to store Qm CIDs
		isMine = false
	}
	return orderedHosts, isMine
}
