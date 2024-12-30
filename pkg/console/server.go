package console

import (
	"context"
	"fmt"

	"github.com/labstack/echo/v4"
)

func (c *Console) setupServer() {
	if c.e == nil {
		c.e = echo.New()
	}
}

func (c *Console) startServer(ctx context.Context) error {
	// TODO: register routes

	if !c.embedded {
		return nil
	}

	go func() {
		<-ctx.Done()
		c.logger.Info("Context canceled, shutting down the server...")
		if err := c.e.Shutdown(ctx); err != nil {
			c.logger.Errorf("Error while shutting down server: %v", err)
		}
	}()

	// Start the Echo server
	c.logger.Infof("Starting server on %s:%d", c.host, c.port)
	return c.e.Start(fmt.Sprintf("%s:%d", c.host, c.port))
}
