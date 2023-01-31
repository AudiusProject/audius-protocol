package storage

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"time"

	"comms.audius.co/discovery/config"
	"comms.audius.co/shared/peering"
	"comms.audius.co/storage/glue"
	"comms.audius.co/storage/web"
	"github.com/nats-io/nats.go"
)

const (
	GlobalNamespace   string = "0"
	ReplicationFactor int    = 3
)

func StorageMain() {

	// TODO: shouldn't use discovery config
	config.Init()

	jsc, err := func() (nats.JetStreamContext, error) {
		err := peering.PollRegisteredNodes()
		if err != nil {
			return nil, err
		}
		peerMap := peering.Solicit()
		return peering.DialJetstream(peerMap)
	}()

	if err != nil {
		log.Fatal(err)
	}

	g := glue.New(GlobalNamespace, ReplicationFactor, jsc)
	e := web.NewServer(g)

	// Start server
	go func() {
		if err := e.Start(":8926"); err != nil && err != http.ErrServerClosed {
			e.Logger.Fatal("shutting down the server", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server with a timeout of 10 seconds.
	// Use a buffered channel to avoid missing signals as recommended for signal.Notify
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt)
	<-quit
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := e.Shutdown(ctx); err != nil {
		e.Logger.Fatal(err)
	}
}
