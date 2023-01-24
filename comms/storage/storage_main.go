package storage

import (
	"log"

	"comms.audius.co/discovery/config"
	"comms.audius.co/discovery/jetstream"
	"comms.audius.co/shared/peering"
	"comms.audius.co/storage/glue"
	"comms.audius.co/storage/web"
)

const (
	GlobalNamespace   string = "0"
	ReplicationFactor int    = 3
)

func StorageMain() {
	// get peers
	// dial nats
	// start echo http server

	// TODO: shouldn't use discovery config
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

	// e := echo.New()
	// e.HideBanner = true
	// e.Debug = true

	// transcode.DemoTime(jetstream.GetJetstreamContext(), e)

	g := glue.New(GlobalNamespace, ReplicationFactor, jetstream.GetJetstreamContext())
	e := web.NewServer(g)

	e.Logger.Fatal(e.Start(":8926"))
}
