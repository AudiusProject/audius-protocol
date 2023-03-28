package rpcz

import (
	"log"
	"os"
	"testing"

	"comms.audius.co/discovery/db"
)

var (
	testValidator *Validator
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

	// run tests
	code := m.Run()

	// teardown
	db.Conn.Close()

	os.Exit(code)
}
