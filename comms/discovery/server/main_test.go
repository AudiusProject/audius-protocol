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
	// setup
	err := db.Dial()
	if err != nil {
		log.Fatal(err)
	}
	if _, err = db.Conn.Exec("truncate table chat cascade"); err != nil {
		log.Fatal(err)
	}
	if _, err = db.Conn.Exec("truncate table users cascade"); err != nil {
		log.Fatal(err)
	}
	if _, err = db.Conn.Exec("truncate table chat_member cascade"); err != nil {
		log.Fatal(err)
	}
	if _, err = db.Conn.Exec("truncate table chat_message cascade"); err != nil {
		log.Fatal(err)
	}
	if _, err = db.Conn.Exec("truncate table rpc_log cascade"); err != nil {
		log.Fatal(err)
	}

	// connect to NATS and create JetStream Context
	discoveryConfig := config.GetDiscoveryConfig()
	p, err := peering.New(&discoveryConfig.PeeringConfig)
	if err != nil {
		log.Fatal(err)
	}

	nc, err := p.DialNats(nil)
	if err != nil {
		log.Fatal(err)
	}
	jsc, err := nc.JetStream(nats.PublishAsyncMaxPending(256))
	if err != nil {
		log.Fatal(err)
	}

	// clear nats state
	jsc.DeleteKeyValue(config.RateLimitRulesBucketName)
	jsc.DeleteStream("audius")
	jsc.DeleteStream("audius.rpc")

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
