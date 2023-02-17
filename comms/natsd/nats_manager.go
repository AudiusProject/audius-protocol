package natsd

import (
	"fmt"
	"log"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

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
		if info == nil || info.Nkey == "" {
			continue
		}

		user := &server.NkeyUser{
			Nkey: info.Nkey,
		}
		nkeys = append(nkeys, user)

		// we use the Cluster Name as the username in the route username and password...
		// only add route if the server is a member of the same cluster.
		if info.NatsIsReachable && info.NatsRoute != "" && strings.Contains(info.NatsRoute, config.NatsClusterName) {
			route, err := url.Parse(info.NatsRoute)
			if err != nil {
				config.Logger.Warn("invalid nats route url: " + info.NatsRoute)
			} else {
				routes = append(routes, route)
			}
		}
	}

	serverName := config.WalletAddress
	if config.IsCreatorNode {
		tags = append(tags, "storage")
		serverName = "storage_" + config.WalletAddress
	} else {
		tags = append(tags, "discovery")
	}

	writeDeadline, _ := time.ParseDuration("60s")

	log.Printf("store dir: %s\n", filepath.Join(os.Getenv("NATS_STORE_DIR"), config.NatsClusterName))
	opts := &server.Options{
		ServerName: serverName,
		HTTPPort:   8222,
		Logtime:    true,
		// Debug:      true,

		JetStream: true,
		StoreDir:  filepath.Join(os.Getenv("NATS_STORE_DIR"), config.NatsClusterName),

		Tags: tags,

		// increase auth timeout and write deadline
		AuthTimeout:   60,
		WriteDeadline: writeDeadline,
	}
	config.Logger.Info("starting NATS in cluster mode... ")
	if config.NatsClusterUsername == "" {
		log.Fatal("config.NatsClusterUsername not set")
	}

	opts.Cluster = server.ClusterOpts{
		Name:      config.NatsClusterName,
		Host:      "0.0.0.0",
		Port:      6222,
		Username:  config.NatsClusterUsername,
		Password:  config.NatsClusterPassword,
		Advertise: fmt.Sprintf("%s:6222", config.IP),
		// NoAdvertise: true,

		// increase auth timeout, bounded connection retry
		AuthTimeout:    60,
		ConnectRetries: 30,
	}

	opts.Routes = routes
	opts.Nkeys = nkeys

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
		log.Fatalln("fatal error creating nats server: ", err)
	}

	// Start the server via goroutine
	manager.natsServer.ConfigureLogger()
	go manager.natsServer.Start()

}
