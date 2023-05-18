package discovery

import (
	"log"
	"os"
	"strings"

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
	discoveryConfig := config.Parse()

	g.Go(func() error {
		var err error

		// dial db
		err = db.Dial()
		if err != nil {
			return err
		}

		// query The Graph for peers
		// soon: easy to configure peer source for local cluster / test stuff
		// also: refresh peers on interval (in stage / prod at least)
		{
			peers, err := the_graph.Query(discoveryConfig.IsStaging, false)
			if err != nil {
				return err
			}

			// hack: fill in hostname if missing
			if discoveryConfig.MyHost == "" {
				for _, peer := range peers {
					if strings.EqualFold(peer.Wallet, discoveryConfig.MyWallet) {
						discoveryConfig.MyHost = peer.Host
						break
					}
				}
			}

			discoveryConfig.SetPeers(peers)
		}

		// create RPC processor
		proc, err = rpcz.NewProcessor(discoveryConfig)
		if err != nil {
			return err
		}

		// start sweepers
		proc.StartPeerClients()

		err = pubkeystore.Dial(discoveryConfig)
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

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8925"
	}
	e := server.NewServer(discoveryConfig, proc)
	e.Logger.Fatal(e.Start(":" + port))
}
