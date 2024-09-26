package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"

	"github.com/AudiusProject/audius-protocol/core/common"
	"github.com/AudiusProject/audius-protocol/core/core_pkg"
	"github.com/AudiusProject/audius-protocol/mediorum/mediorum_pkg"
	"github.com/AudiusProject/audius-protocol/uptime/uptime_pkg"
)

func main() {
	logger := common.NewLogger(nil)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	// U P T I M E
	go func() {
		if err := uptime_pkg.Run(ctx, logger); err != nil {
			logger.Errorf("fatal uptime error: %v", err)
			cancel()
		}
	}()

	// C O R E
	go func() {
		if err := core_pkg.Run(ctx, logger); err != nil {
			logger.Errorf("fatal core error: %v", err)
			cancel()
		}
	}()

	// M E D I O R U M
	go func() {
		if err := mediorum_pkg.Run(ctx, logger); err != nil {
			logger.Errorf("fatal mediorum error: %v", err)
			cancel()
		}
	}()

	<-sigChan
	logger.Info("Received termination signal, shutting down...")

	cancel()

	<-ctx.Done() // run forever, no crashloops
	logger.Info("Shutdown complete")
}
