package rpcz

import (
	"log"
	"os"
	"testing"

	"comms.audius.co/discovery/config"
	"comms.audius.co/discovery/db"
	"comms.audius.co/shared/peering"
	"github.com/nats-io/nats.go"
)

var (
	jsc           nats.JetStreamContext
	testValidator *Validator
)

// this runs before all tests (not a per-test setup / teardown)
func TestMain(m *testing.M) {
	discoveryConfig := config.GetDiscoveryConfig()

	// setup
	err := db.Dial()
	if err != nil {
		log.Fatal(err)
	}

	// connect to NATS and create JetStream Context
	p, err := peering.New(&discoveryConfig.PeeringConfig)
	if err != nil {
		log.Fatal(err)
	}

	nc, err := p.DialNats(nil)
	if err != nil {
		log.Fatal(err)
	}
	jsc, err = nc.JetStream(nats.PublishAsyncMaxPending(256))
	if err != nil {
		log.Fatal(err)
	}

	// setup test validator
	limiter, err := NewRateLimiter(jsc)
	if err != nil {
		log.Fatal(err)
	}
	testValidator = &Validator{
		db:      db.Conn,
		limiter: limiter,
	}

	// run tests
	code := m.Run()

	// teardown
	db.Conn.Close()
	nc.Close()

	os.Exit(code)
}
