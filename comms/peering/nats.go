package peering

import (
	"fmt"
	"log"
	"net/url"
	"os"
	"sync"

	"comms.audius.co/config"
	"comms.audius.co/internal/rpcz"
	"github.com/nats-io/nats-server/v2/server"
	"github.com/nats-io/nats.go"
)

type NatsManager struct {
	myNatsClient *nats.Conn
	natsServer   *server.Server
	mu           sync.Mutex
}

func (manager *NatsManager) StartNats(peerMap map[string]*Info) {

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
		StoreDir:  os.Getenv("NATS_STORE_DIR"),
	}

	if config.NatsReplicaCount < 2 {
		config.Logger.Info("starting NATS in standalone mode", "peer count", len(routes))
	} else {
		config.Logger.Info("starting NATS in cluster mode... ")
		if config.NatsClusterUsername == "" {
			log.Fatal("config.NatsClusterUsername not set")
		}

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

}

func dialNatsUrl(natsUrl string) (*nats.Conn, error) {
	if config.NatsUseNkeys {
		nkeySign := func(nonce []byte) ([]byte, error) {
			return config.NkeyPair.Sign(nonce)
		}
		return nats.Connect(natsUrl, nats.Nkey(config.NkeyPublic, nkeySign))
	} else {
		return nats.Connect(natsUrl)
	}
}

func createJetstreamStreams(jsc nats.JetStreamContext) error {

	streamInfo, err := jsc.AddStream(&nats.StreamConfig{
		Name:     config.GlobalStreamName,
		Subjects: []string{config.GlobalStreamSubject},
		Replicas: config.NatsReplicaCount,
		// DenyDelete: true,
		// DenyPurge:  true,
	})
	if err != nil {
		return err
	}

	config.Logger.Info("create stream", "strm", streamInfo)

	// create kv buckets
	_, err = jsc.CreateKeyValue(&nats.KeyValueConfig{
		Bucket:   config.PubkeystoreBucketName,
		Replicas: config.NatsReplicaCount,
	})
	if err != nil {
		return err
	}

	_, err = jsc.CreateKeyValue(&nats.KeyValueConfig{
		Bucket:   config.RateLimitRulesBucketName,
		Replicas: config.NatsReplicaCount,
	})
	if err != nil {
		return err
	}

	return nil
}

func createConsumer(jsc nats.JetStreamContext) error {

	// ------------------------------------------------------------------------------
	// TEMP: Subscribe to the subject for the demo
	// this is the "processor" for DM messages... which just inserts them into comm log table for now
	// it assumes that nats message has the signature header
	// but this is not the case for identity relay messages, for instance, which should have their own consumer
	// also, should be a pull consumer with explicit ack.
	// matrix-org/dendrite codebase has some nice examples to follow...

	sub, err := jsc.Subscribe(config.GlobalStreamSubject, rpcz.Apply, nats.Durable(config.WalletAddress))

	if info, err := sub.ConsumerInfo(); err == nil {
		config.Logger.Info("create subscription", "sub", info)
	}

	return err
}
