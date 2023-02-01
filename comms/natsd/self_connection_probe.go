package natsd

import (
	"fmt"
	"time"

	"github.com/nats-io/nats-server/v2/server"
	"github.com/nats-io/nats.go"
)

func selfConnectionProbe(myIP string) (bool, error) {
	opts := &server.Options{
		ServerName: "connection_test",
		Logtime:    true,
	}

	server, err := server.NewServer(opts)
	if err != nil {
		return false, err
	}

	go server.Start()
	defer server.Shutdown()

	if !server.ReadyForConnections(4 * time.Second) {
		return false, fmt.Errorf("server start timed out")
	}

	u := fmt.Sprintf("nats://%s:4222", myIP)
	nc, err := nats.Connect(u)
	if err != nil {
		return false, err
	}

	nc.Close()
	server.Shutdown()
	server.WaitForShutdown()
	return true, nil
}
