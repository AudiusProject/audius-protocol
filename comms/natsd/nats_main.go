package natsd

import (
	"time"

	"comms.audius.co/discovery/config"
	"comms.audius.co/shared/peering"
	"github.com/labstack/echo/v4"
)

func NatsMain() {
	config.Init()
	peering.PollRegisteredNodes()

	go func() {
		e := echo.New()
		e.HideBanner = true
		e.Debug = true
		e.POST("/nats/exchange", peering.ExchangeEndpoint)
		e.GET("/nats/debug", func(c echo.Context) error {
			peers := peering.ListPeers()
			for idx, peer := range peers {
				// peer.IP = ""
				peer.NatsRoute = ""
				peers[idx] = peer
			}
			return c.JSON(200, peers)
		})
		e.Logger.Fatal(e.Start(":8924"))
	}()

	natsman := NatsManager{}
	for {
		peerMap := peering.Solicit()
		natsman.StartNats(peerMap)
		time.Sleep(time.Minute)
	}
}
