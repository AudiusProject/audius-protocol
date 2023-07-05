package rpcz

import (
	"log"
	"os"
	"testing"

	"comms.audius.co/discovery/config"
	"comms.audius.co/discovery/db"
)

var (
	testValidator *Validator
	testProcessor *RPCProcessor
)

// this runs before all tests (not a per-test setup / teardown)
func TestMain(m *testing.M) {

	// setup
	err := db.Dial()
	if err != nil {
		log.Fatal(err)
	}

	// setup test validator
	limiter, err := NewRateLimiter()
	if err != nil {
		log.Fatal(err)
	}
	testValidator = &Validator{
		db:      db.Conn,
		limiter: limiter,
	}

	// setup test processor
	discoveryConfig := config.Parse()
	testProcessor, err = NewProcessor(discoveryConfig)

	// run tests
	code := m.Run()

	// teardown
	db.Conn.Close()

	os.Exit(code)
}
