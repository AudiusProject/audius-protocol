package console

import (
	"context"
	"os"
	"os/signal"
	"syscall"
)

func (c *Console) handleSignals(ctx context.Context, cancel context.CancelFunc) error {
	logger := c.logger

	signalChan := make(chan os.Signal, 1)
	signal.Notify(signalChan, os.Interrupt, syscall.SIGTERM)

	select {
	case sig := <-signalChan:
		logger.Infof("Received signal: %s, initiating shutdown...", sig)
		cancel()
	case <-ctx.Done():
		logger.Info("Context done, stopping signal listener")
	}

	return nil
}
