package natsd

import (
	"log"
	"net/url"
	"os"
	"sync"

	"comms.audius.co/discovery/config"
	"comms.audius.co/shared/peering"
	"github.com/nats-io/nats-server/v2/server"
)

type NatsManager struct {
	natsServer *server.Server
	mu         sync.Mutex
}

func (manager *NatsManager) StartNats(peerMap map[string]*peering.Info) {

	manager.mu.Lock()
	defer manager.mu.Unlock()

	routes := []*url.URL{}
	nkeys := []*server.NkeyUser{}
	tags := []string{}

	for _, info := range peerMap {
		if info == nil || info.NatsRoute == "" {
			continue
		}
		route, err := url.Parse(info.NatsRoute)
		if err != nil {
			config.Logger.Warn("invalid nats route url: " + info.NatsRoute)
			continue
		}
		user := &server.NkeyUser{
			Nkey: info.Nkey,
		}

		routes = append(routes, route)
		nkeys = append(nkeys, user)
	}

	serverName := config.WalletAddress
	if config.IsCreatorNode {
		tags = append(tags, "storage")
		serverName = "storage_" + config.WalletAddress
	} else {
		tags = append(tags, "discovery")
	}

	opts := &server.Options{
		ServerName: serverName,
		HTTPPort:   8222,
		Logtime:    true,
		// Debug:      true,

		JetStream: true,
		StoreDir:  os.Getenv("NATS_STORE_DIR"),

		Tags: tags,
	}

	if config.NatsReplicaCount < 2 {
		config.Logger.Info("starting NATS in standalone mode", "peer count", len(routes))
	} else {
		config.Logger.Info("starting NATS in cluster mode... ")
		if config.NatsClusterUsername == "" {
			log.Fatal("config.NatsClusterUsername not set")
		}

		opts.Cluster = server.ClusterOpts{
			Name:        "comms",
			Host:        "0.0.0.0",
			Port:        6222,
			Username:    config.NatsClusterUsername,
			Password:    config.NatsClusterPassword,
			NoAdvertise: true,
		}

		if len(routes) > 0 {
			opts.Routes = routes
		}
		opts.Nkeys = nkeys

	}

	// this is kinda jank... probably want a better way to check if natsServer is initialized and health
	// but will do for now
	if manager.natsServer != nil {
		if err := manager.natsServer.ReloadOptions(opts); err != nil {
			config.Logger.Warn("error in nats ReloadOptions", "err", err)
		}
		return
	}

	// Initialize new server with options
	var err error
	manager.natsServer, err = server.NewServer(opts)
	if err != nil {
		panic(err)
	}

	// Start the server via goroutine
	manager.natsServer.ConfigureLogger()
	go manager.natsServer.Start()

}
