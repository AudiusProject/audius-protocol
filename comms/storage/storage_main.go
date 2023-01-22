package storage

import (
	"log"

	"comms.audius.co/discovery/config"
	"comms.audius.co/discovery/jetstream"
	"comms.audius.co/shared/peering"
	"comms.audius.co/storage/transcode"
	"github.com/labstack/echo/v4"
)

func StorageMain() {
	// get peers
	// dial nats
	// start echo http server

	// todo: shouldn't use discovery coonfig
	config.Init()

	err := func() error {
		err := peering.PollDiscoveryProviders()
		if err != nil {
			return err
		}
		peerMap := peering.Solicit()
		return jetstream.Dial(peerMap)
	}()

	if err != nil {
		log.Fatal(err)
	}

	e := echo.New()
	e.HideBanner = true
	e.Debug = true

	transcode.DemoTime(jetstream.GetJetstreamContext(), e)

	e.Logger.Fatal(e.Start(":8926"))
}
