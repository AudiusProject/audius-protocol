package discovery

import (
	"log"
	"os"
	"strings"
	"time"

	"comms.audius.co/discovery/config"
	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/misc"
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
		err = refreshRegisteredPeers(discoveryConfig)
		if err != nil {
			return err
		}

		// refresh registered peers on interval
		go backgroundRefreshRegisteredPeers(discoveryConfig)

		// create RPC processor
		proc, err = rpcz.NewProcessor(discoveryConfig)
		if err != nil {
			return err
		}

		// start peer clients
		// todo: would be nice to only start sweepers if registered...
		proc.StartPeerClients()

		err = pubkeystore.Dial(discoveryConfig)
		if err != nil {
			return err
		}

		go pubkeystore.StartPubkeyBackfill()

		return nil

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

	go e.StartWebsocketTester()

	e.Logger.Fatal(e.Start(":" + port))
}

func backgroundRefreshRegisteredPeers(discoveryConfig *config.DiscoveryConfig) {
	for {
		time.Sleep(time.Minute * 5)
		if err := refreshRegisteredPeers(discoveryConfig); err != nil {
			slog.Error("refreshRegisteredPeers failed", "err", err)
		}
	}
}

func refreshRegisteredPeers(discoveryConfig *config.DiscoveryConfig) error {
	if discoveryConfig.IsDev || discoveryConfig.IsSandbox {
		discoveryConfig.IsRegisteredWallet = true
		return nil
	}

	peers, err := the_graph.Query(discoveryConfig.IsStaging, false)
	if err != nil {
		return err
	}

	if config.IsHonoraryNode(discoveryConfig.MyWallet) {
		// special case read only nodes
		discoveryConfig.IsRegisteredWallet = true
	} else {
		// validate host + wallet pair
		matchingNodes := []the_graph.Peer{}
		for _, peer := range peers {
			if strings.EqualFold(peer.Wallet, discoveryConfig.MyWallet) {
				matchingNodes = append(matchingNodes, peer)
			}
		}

		// we can safely infer hostname if hostname is blank and the wallet address is not reused
		if discoveryConfig.MyHost == "" && len(matchingNodes) == 1 {
			discoveryConfig.MyHost = misc.TrimTrailingSlash(matchingNodes[0].Host)
		}

		// wallet + hostname match => IsRegisteredWallet
		for _, peer := range matchingNodes {
			if strings.EqualFold(peer.Host, discoveryConfig.MyHost) {
				discoveryConfig.IsRegisteredWallet = true
				break
			}
		}
	}

	discoveryConfig.SetPeers(peers)

	return nil
}
