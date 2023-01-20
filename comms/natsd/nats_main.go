package natsd

import (
	"time"

	"comms.audius.co/discovery/config"
	"comms.audius.co/shared/peering"
)

func NatsMain() {
	config.Init()
	peering.PollDiscoveryProviders()
	natsman := NatsManager{}
	for {
		peerMap := peering.Solicit()
		natsman.StartNats(peerMap)
		time.Sleep(time.Minute * 5)
	}
}
