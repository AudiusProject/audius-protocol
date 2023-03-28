package discovery

import (
	"log"

	"comms.audius.co/discovery/config"
	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/pubkeystore"
	"comms.audius.co/discovery/rpcz"
	"comms.audius.co/discovery/server"
	"comms.audius.co/discovery/the_graph"
	"golang.org/x/sync/errgroup"
)

func DiscoveryMain() {
	// dial datasources in parallel
	g := errgroup.Group{}

	var proc *rpcz.RPCProcessor
	discoveryConfig := config.GetDiscoveryConfig()

	g.Go(func() error {
		var err error

		// dial db
		err = db.Dial()
		if err != nil {
			return err
		}

		// create RPC processor
		proc, err = rpcz.NewProcessor()
		if err != nil {
			return err
		}

		// start SSE clients
		peers, err := the_graph.Query(discoveryConfig.IsStaging, false)
		if err != nil {
			return err
		}
		proc.StartSSEClients(discoveryConfig, peers)

		err = pubkeystore.Dial()
		if err != nil {
			return err
		}

		go pubkeystore.StartPubkeyBackfill()

		return nil

	})
	g.Go(func() error {
		return db.RunMigrations()
	})
	if err := g.Wait(); err != nil {
		log.Fatal(err)
	}

	// Start comms server on :8925
	e := server.NewServer(proc)
	e.Logger.Fatal(e.Start(":8925"))
}
