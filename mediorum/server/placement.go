package server

import (
	"mediorum/cidutil"
	"time"

	"github.com/tysonmote/rendezvous"
	"golang.org/x/exp/slices"
)

func (ss *MediorumServer) rendezvous(h string) ([]string, bool) {
	hosts := ss.findHealthyPeers(5 * time.Minute)
	if slices.Index(hosts, ss.Config.Self.Host) == -1 {
		hosts = append(hosts, ss.Config.Self.Host)
	}

	hashRing := rendezvous.New(hosts...)
	orderedHosts := hashRing.GetN(len(hosts), h)

	myRank := slices.Index(orderedHosts, ss.Config.Self.Host)
	isMine := myRank >= 0 && myRank < ss.Config.ReplicationFactor

	if ss.Config.StoreAll {
		isMine = true
	} else if cidutil.IsLegacyCID(h) {
		// TODO(theo): Don't store Qm CIDs for now unless STORE_ALL is true. Remove this once all nodes have enough space to store Qm CIDs
		isMine = false
	}
	return orderedHosts, isMine
}
