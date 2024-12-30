package console

import (
	"context"

	"github.com/AudiusProject/audius-protocol/pkg/core/common"
	"github.com/AudiusProject/audius-protocol/pkg/core/sdk"
	"github.com/AudiusProject/audius-protocol/pkg/logger"
	"github.com/labstack/echo/v4"
	"golang.org/x/sync/errgroup"
)

const (
	ProdNode = "creatornode2.audius.co"
	StageNode = "creatornode11.staging.audius.co"
	DevNode = "audius-protocol-creator-node-1"

	DefaultHost = "0.0.0.0"
	DefaultPort = 8080
	DefaultUrlBase = "/console"
)

type Console struct {
	logger *common.Logger
	sdk *sdk.Sdk
	e *echo.Echo

	env string
	host string
	port int
	urlBase string

	// if echo is provided then console
	// will expect echo to be started by
	// another process
	embedded bool
}

// sets up the console struct, you should only need to pass
// an env param to console and it'll start up correctly
// this populates everything else with defaults if they aren't
// set
func (c *Console) setupConsole() {
	if c.logger == nil {
		c.logger = common.NewLogger(nil)
	}

	if c.env == "" {
		c.env = "stage"
	}

	// if echo wasn't provided, set defaults
	if c.e == nil {
		c.e = echo.New()
		c.embedded = false
		c.host = DefaultHost
		c.port = DefaultPort
		c.urlBase = DefaultUrlBase
	} else {
		c.embedded = true
	}
}

func Run(cs ...*Console) error {
	c := &Console{}
	if len(cs) > 0 {
		c = cs[0]
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	c.setupConsole()

	c.logger.Info("setting up console")

	useHttps := true
	endpoint := ProdNode
	if c.env == "stage" {
		endpoint = StageNode
	}
	if c.env == "dev" {
		endpoint = DevNode
		useHttps = false
	}

	sdk, err := sdk.NewSdk(sdk.WithOapiendpoint(endpoint), sdk.WithUsehttps(useHttps))
	if err != nil {
		logger.Errorf("sdk could not be initialized for console: %v", err)
		return err
	}
	c.sdk = sdk

	g, ctx := errgroup.WithContext(ctx)

	g.Go(func() error {
		return c.startIndexer(ctx)
	})

	g.Go(func() error {
		return c.startServer(ctx)
	})

	g.Go(func() error {
		return c.handleSignals(ctx, cancel)
	})

	if err := g.Wait(); err != nil {
		logger.Errorf("crash: %v", err)
		return err
	}
	return nil
}
