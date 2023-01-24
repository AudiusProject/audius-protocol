package storage

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"time"

	"comms.audius.co/discovery/config"
	"comms.audius.co/discovery/jetstream"
	"comms.audius.co/shared/peering"
	"github.com/labstack/echo/v4"
)

func StorageMain() {

	// todo: shouldn't use discovery config
	config.Init()

	err := func() error {
		err := peering.PollRegisteredNodes()
		if err != nil {
			return err
		}
		peerMap := peering.Solicit()
		return jetstream.Dial(peerMap)
	}()

	if err != nil {
		log.Fatal(err)
	}

	e := echo.New()
	e.HideBanner = true
	e.Debug = true

	startStorageServer(jetstream.GetJetstreamContext(), e)

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
