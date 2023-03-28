package server

import (
	"log"
	"os"
	"testing"

	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/rpcz"
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

	proc, err := rpcz.NewProcessor()
	if err != nil {
		log.Fatal(err)
	}
	testServer = NewServer(proc)

	// start SSE clients
	// TODO: test peers
	proc.StartSSEClients(nil, nil)

	// run tests
	code := m.Run()

	// teardown
	db.Conn.Close()

	os.Exit(code)
}
