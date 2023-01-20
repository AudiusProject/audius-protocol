package rpcz

import (
	"log"
	"os"
	"testing"

	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/jetstream"
	"github.com/nats-io/nats-server/v2/server"
	"github.com/nats-io/nats-server/v2/test"
	"github.com/nats-io/nats.go"
)

// this runs before all tests (not a per-test setup / teardown)
func TestMain(m *testing.M) {
	// setup
	os.Setenv("audius_db_url", "postgresql://postgres:postgres@localhost:5454/comtest?sslmode=disable")
	err := db.Dial()
	if err != nil {
		log.Fatal(err)
	}

	// connect to NATS and create JetStream Context
	opts := server.Options{
		Host:      "127.0.0.1",
		Port:      4222,
		JetStream: true,
	}
	natsServer := test.RunServer(&opts)
	nc, err := nats.Connect(nats.DefaultURL)
	if err != nil {
		log.Fatal(err)
	}
	js, err := nc.JetStream(nats.PublishAsyncMaxPending(256))
	if err != nil {
		log.Fatal(err)
	}
	jetstream.SetJetstreamContext(js)

	// run tests
	code := m.Run()

	// teardown
	db.Conn.Close()
	nc.Close()
	natsServer.Shutdown()

	os.Exit(code)
}
