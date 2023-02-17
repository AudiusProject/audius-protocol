package server

import (
	"log"
	"os"
	"testing"

	"comms.audius.co/discovery/config"
	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/rpcz"
	"comms.audius.co/shared/peering"
	"github.com/nats-io/nats.go"
)

var (
	testServer *ChatServer
)

// this runs before all tests (not a per-test setup / teardown)
func TestMain(m *testing.M) {
	discoveryConfig := config.GetDiscoveryConfig()
	config.Init(discoveryConfig.PeeringConfig.Keys, discoveryConfig.PeeringConfig.TestHost)

	// setup
	err := db.Dial()
	if err != nil {
		log.Fatal(err)
	}

	// connect to NATS and create JetStream Context
	nc, err := peering.New(&discoveryConfig.PeeringConfig).DialNats(nil)
	if err != nil {
		log.Fatal(err)
	}
	jsc, err := nc.JetStream(nats.PublishAsyncMaxPending(256))
	if err != nil {
		log.Fatal(err)
	}

	// clear nats state
	jsc.DeleteKeyValue(config.RateLimitRulesBucketName)

	proc, err := rpcz.NewProcessor(jsc)
	if err != nil {
		log.Fatal(err)
	}
	testServer = NewServer(jsc, proc)

	// run tests
	code := m.Run()

	// teardown
	db.Conn.Close()

	os.Exit(code)
}
