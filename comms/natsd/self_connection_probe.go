package natsd

import (
	"fmt"
	"log"
	"time"

	"github.com/nats-io/nats-server/v2/server"
	"github.com/nats-io/nats.go"
)

func selfConnectionProbe(myIP string) (bool, error) {
	connected := false

	opts := &server.Options{
		ServerName: "connection_test",
		Logtime:    true,
	}

	server, err := server.NewServer(opts)
	if err != nil {
		return false, err
	}

	go server.Start()

	if !server.ReadyForConnections(4 * time.Second) {
		log.Println("self connection server failed to start in 4 seconds")
	}

	u := fmt.Sprintf("nats://%s:4222", myIP)
	nc, err := nats.Connect(u)
	if err == nil && nc.IsConnected() {
		connected = true
	}

	nc.Close()
	server.Shutdown()
	server.WaitForShutdown()
	return connected, err
}
