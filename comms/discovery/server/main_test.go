package server

import (
	"log"
	"os"
	"testing"

	"comms.audius.co/discovery/config"
	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/rpcz"
	"github.com/labstack/echo/v4"
	"github.com/nats-io/nats.go"
)

var (
	testServer *echo.Echo
)

// this runs before all tests (not a per-test setup / teardown)
func TestMain(m *testing.M) {
	config.Init()

	// setup
	os.Setenv("audius_db_url", "postgresql://postgres:postgres@localhost:5454/comtest?sslmode=disable")
	err := db.Dial()
	if err != nil {
		log.Fatal(err)
	}

	// connect to NATS and create JetStream Context
	nc, err := nats.Connect(nats.DefaultURL)
	if err != nil {
		log.Fatal(err)
	}
	jsc, err := nc.JetStream(nats.PublishAsyncMaxPending(256))
	if err != nil {
		log.Fatal(err)
	}

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
