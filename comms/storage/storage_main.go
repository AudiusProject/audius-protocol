package storage

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"time"

	"comms.audius.co/shared/peering"
	"comms.audius.co/storage/config"
	"comms.audius.co/storage/storageserver"
	"github.com/nats-io/nats.go"
	"github.com/nats-io/prometheus-nats-exporter/exporter"
)

func StorageMain() {
	storageConfig := config.GetStorageConfig()
	peering := peering.New(&storageConfig.PeeringConfig)
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

	ss := storageserver.New(storageConfig, jsc, peering)

	// Start server
	go func() {
		if err := ss.WebServer.Start(":8926"); err != nil && err != http.ErrServerClosed {
			ss.WebServer.Logger.Fatal("shutting down the server", err)
		}
	}()

	// Get the default options, and set what you need to.  The listen address and port
	// is how prometheus can poll for collected data.
	opts := exporter.GetDefaultExporterOptions()
	opts.ListenAddress = "localhost"
	opts.ListenPort = 8888
	opts.GetVarz = true
	opts.NATSServerURL = "http://localhost:8222"

	// Start exporter
	exp := exporter.NewExporter(opts)
	exp.Start()
	defer exp.Stop()

	// Wait for interrupt signal to gracefully shutdown the server with a timeout of 10 seconds.
	// Use a buffered channel to avoid missing signals as recommended for signal.Notify
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt)
	<-quit
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := ss.WebServer.Shutdown(ctx); err != nil {
		ss.WebServer.Logger.Fatal(err)

		// Wait until the prometheus exporter is stopped
		exp.WaitUntilDone()
	}
}
