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

	"comms.audius.co/natsd/config"
	"comms.audius.co/shared/peering"
	"github.com/nats-io/nats-server/v2/server"
	"golang.org/x/exp/slog"
)

type NatsManager struct {
	natsServer *server.Server
	mu         sync.Mutex
}

func (manager *NatsManager) StartNats(peerMap map[string]*peering.Info, peering *peering.NatsPeering) {

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
		if info.NatsIsReachable && info.NatsRoute != "" && strings.Contains(info.NatsRoute, config.GetNatsConfig().PeeringConfig.NatsClusterName) {
			route, err := url.Parse(info.NatsRoute)
			if err != nil {
				slog.Warn("invalid nats route url: " + info.NatsRoute)
			} else {
				routes = append(routes, route)
			}
		}
	}

	serverName := ""
	allNodes, _ := peering.AllNodes()
	for _, node := range allNodes {
		if strings.EqualFold(node.DelegateOwnerWallet, peering.Config.Keys.DelegatePublicKey) {
			// TODO: this serverName switching is awful
			serverName = os.Getenv("creatorNodeEndpoint")
			if serverName == "" {
				serverName = os.Getenv("audius_discprov_url")
			}
			if serverName == "" {
				serverName = node.Endpoint
			}
			tags = append(tags, "type:"+node.Type.ID, "delegate:"+node.DelegateOwnerWallet, "owner:"+node.Owner.ID)
			break
		}
	}

	writeDeadline, _ := time.ParseDuration("60s")

	opts := &server.Options{
		ServerName: serverName,
		HTTPPort:   8222,
		Logtime:    true,
		// Debug:      true,

		JetStream: config.GetNatsConfig().EnableJetstream,
		StoreDir:  filepath.Join(config.GetNatsConfig().StoreDir, config.GetNatsConfig().PeeringConfig.NatsClusterName),

		Tags: tags,

		// increase auth timeout and write deadline
		AuthTimeout:   60,
		WriteDeadline: writeDeadline,
	}
	slog.Info("starting NATS in cluster mode... ")
	if peering.NatsClusterUsername == "" {
		log.Fatal("config.NatsClusterUsername not set")
	}

	opts.Cluster = server.ClusterOpts{
		Name:      config.GetNatsConfig().PeeringConfig.NatsClusterName,
		Host:      "0.0.0.0",
		Port:      6222,
		Username:  peering.NatsClusterUsername,
		Password:  peering.NatsClusterPassword,
		Advertise: fmt.Sprintf("%s:6222", peering.IP),
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
			slog.Warn("error in nats ReloadOptions", "err", err)
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
