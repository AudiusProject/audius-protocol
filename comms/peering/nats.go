package peering

import (
	"errors"
	"fmt"
	"log"
	"net/url"
	"sync"
	"time"

	"comms.audius.co/config"
	"comms.audius.co/internal/rpcz"
	"github.com/nats-io/nats-server/v2/server"
	"github.com/nats-io/nats.go"
)

// NATS CLIENTS
var (
	NatsClient      *nats.Conn
	JetstreamClient nats.JetStreamContext
)

type NatsManager struct {
	natsServer *server.Server
	mu         sync.Mutex
}

func (manager *NatsManager) StartNats(peerMap map[string]*Info) {
	if config.NatsClusterUsername == "" {
		log.Fatal("config.NatsClusterUsername not set")
	}

	manager.mu.Lock()
	defer manager.mu.Unlock()

	routes := []*url.URL{}
	nkeys := []*server.NkeyUser{}

	for _, info := range peerMap {
		if info == nil || info.NatsRoute == "" {
			continue
		}
		fmt.Println("nats route: ", info.NatsRoute)
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

	opts := &server.Options{
		ServerName: config.WalletAddress,
		HTTPPort:   8222,
		Logtime:    true,
		// Debug:      true,

		JetStream: true,
	}

	if config.NatsReplicaCount < 2 {
		config.Logger.Info("starting NATS in standalone mode", "peer count", len(routes))
	} else {
		config.Logger.Info("starting NATS in cluster mode... ")

		opts.Cluster = server.ClusterOpts{
			Name:     "comms",
			Host:     "0.0.0.0",
			Port:     6222,
			Username: config.NatsClusterUsername,
			Password: config.NatsClusterPassword,
			// NoAdvertise: true,
		}

		opts.Routes = routes
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

	manager.setupNatsClient()

	manager.setupJetstream()

}

func (manager *NatsManager) setupNatsClient() {

	for attempt := 1; attempt < 20; attempt++ {
		var err error

		if !manager.natsServer.ReadyForConnections(5 * time.Second) {
			config.Logger.Info("nats routing not ready")
			continue
		}

		// todo: this needs to have multiple URLs for peers
		// importantly... if this nats is not reachable we NEED to user a peer url
		natsUrl := manager.natsServer.ClientURL()

		if config.NatsUseNkeys {
			nkeySign := func(nonce []byte) ([]byte, error) {
				return config.NkeyPair.Sign(nonce)
			}
			NatsClient, err = nats.Connect(natsUrl, nats.Nkey(config.NkeyPublic, nkeySign))
		} else {
			NatsClient, err = nats.Connect(natsUrl)
		}

		if err != nil {
			config.Logger.Info("nats client dail failed", "attempt", attempt, "err", err)
			time.Sleep(time.Second * 3)
			continue
		} else {
			break
		}
	}

}

func (manager *NatsManager) setupJetstream() {
	natsServer := manager.natsServer
	nc := NatsClient
	var jsc nats.JetStreamContext

	// TEMP: hardcoded stream config
	tempStreamName := "audius"
	tempStreamSubject := "audius.>"

	var err error
	for i := 1; i < 1000; i++ {

		if i > 1 {
			config.Logger.Warn(err.Error(), "attempt", i)
			time.Sleep(time.Second * 3)
		}

		// wait for server + jetstream to be ready
		if !natsServer.JetStreamIsCurrent() {
			err = errors.New("jetstream not current")
			continue
		}

		config.Logger.Info("jetstream is ready",
			"js_clustered", natsServer.JetStreamIsClustered(),
			"js_leader", natsServer.JetStreamIsLeader(),
			"js_current", natsServer.JetStreamIsCurrent(),
			// "js_peers", natsServer.JetStreamClusterPeers(),
		)

		jsc, err = nc.JetStream(nats.PublishAsyncMaxPending(256))
		if err != nil {
			continue
		}

		var streamInfo *nats.StreamInfo

		if natsServer.JetStreamIsLeader() {
			streamInfo, err = jsc.AddStream(&nats.StreamConfig{
				Name:     tempStreamName,
				Subjects: []string{tempStreamSubject},
				Replicas: config.NatsReplicaCount,
				// DenyDelete: true,
				// DenyPurge:  true,
			})
			if err != nil {
				continue
			}
		} else {
			// wait for stream to exist
			streamInfo, err = jsc.StreamInfo(tempStreamName)
			if err != nil {
				continue
			}
		}

		config.Logger.Info("Stream OK",
			"name", streamInfo.Config.Name,
			"created", streamInfo.Created,
			"replicas", streamInfo.Config.Replicas)
		break

	}

	// TEMP: Subscribe to the subject for the demo
	// this is the "processor" for DM messages... which just inserts them into comm log table for now
	// it assumes that nats message has the signature header
	// but this is not the case for identity relay messages, for instance, which should have their own consumer
	// also, should be a pull consumer with explicit ack.
	// matrix-org/dendrite codebase has some nice examples to follow...
	for {
		sub, err := jsc.Subscribe(tempStreamSubject, rpcz.Apply, nats.Durable(config.WalletAddress))
		if err != nil {
			config.Logger.Warn("error creating consumer", "err", err)
			time.Sleep(time.Second * 5)
		} else {
			config.Logger.Info("sub OK", "sub", sub.Subject)
			break
		}
	}

	// create kv buckets
	_, err = jsc.CreateKeyValue(&nats.KeyValueConfig{
		Bucket:   config.PubkeystoreBucketName,
		Replicas: config.NatsReplicaCount,
	})
	if err != nil {
		log.Fatal("CreateKeyValue failed", err)
	}

	// finally "expose" this as public var
	// the server checks if this is non-nil to know if it's ready
	// todo: THIS IS NOT SAFE... should be something like peering.GetJetstream with a mutex
	JetstreamClient = jsc
}
