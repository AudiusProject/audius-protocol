package discovery

import (
	"os"
	"strings"

	"comms.audius.co/discovery/config"
	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/pubkeystore"
	"comms.audius.co/discovery/rpcz"
	"comms.audius.co/discovery/server"
	"comms.audius.co/discovery/the_graph"
	"golang.org/x/exp/slog"
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

			// find self in peer list
			// correct hostname if configured incorrectly
			for _, peer := range peers {
				if strings.EqualFold(peer.Wallet, discoveryConfig.MyWallet) {
					if discoveryConfig.MyHost != peer.Host {
						slog.Warn("incorrect hostname", "incorrect", discoveryConfig.MyHost, "correct", peer.Host)
						discoveryConfig.MyHost = peer.Host
					}
					break
				}
			}

			// fix any relayed_by records that have (incorrect) trailing slash
			{
				r, err := db.Conn.Exec(`update rpc_log set relayed_by = substr(relayed_by, 1, length(relayed_by)-1) where relayed_by like '%/';`)
				if err != nil {
					slog.Error("fix rpc_log relayed_by failed", err)
				} else {
					numCorrected, _ := r.RowsAffected()
					slog.Warn("removed trailing slashes", "num_corrected", numCorrected)
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

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8925"
	}
	e := server.NewServer(discoveryConfig, proc)

	go e.StartWebsocketTester()

	e.Logger.Fatal(e.Start(":" + port))
}
