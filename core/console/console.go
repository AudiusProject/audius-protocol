//go:generate templ generate

package console

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/AudiusProject/audius-protocol/core/common"
	"github.com/AudiusProject/audius-protocol/core/config"
	"github.com/AudiusProject/audius-protocol/core/console/components"
	"github.com/AudiusProject/audius-protocol/core/console/middleware"
	"github.com/AudiusProject/audius-protocol/core/db"
	"github.com/cometbft/cometbft/rpc/client"
	rpchttp "github.com/cometbft/cometbft/rpc/client/http"
	"github.com/cometbft/cometbft/rpc/client/local"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
)

type Console struct {
	config *config.Config
	rpc    client.Client
	db     *db.Queries
	e      *echo.Echo
	logger *common.Logger
	c      *components.Components
}

func NewConsole(config *config.Config, logger *common.Logger, e *echo.Echo, rpcUrl string, pool *pgxpool.Pool) (*Console, error) {
	httpClient, err := rpchttp.New(rpcUrl)
	if err != nil {
		return nil, fmt.Errorf("could not create rpc client: %v", err)
	}

	c := &Console{
		config: config,
		rpc:    httpClient,
		e:      e,
		logger: logger.Child("console"),
		db:     db.New(pool),
		c:      components.NewComponents(config, httpClient, db.New(pool)),
	}

	consoleBase := e.Group("/console")

	c.registerRoutes(logger, consoleBase)

	return c, nil
}

func (c *Console) registerRoutes(logger *common.Logger, groups ...*echo.Group) {
	for _, g := range groups {
		g.Use(middleware.ErrorLoggerMiddleware(logger))

		g.GET("", c.homePage)
		g.GET("/tx/:tx", c.txPage)
		g.GET("/block/:block", c.blockPage)
		g.GET("/node", c.networkPage)
		g.GET("/node/:node", c.nodePage)
		g.GET("/sla/:rollup", c.slaPage)

		g.GET("/headerinfo", c.headerInfo)
	}
}

func (c *Console) AwaitLocalRpc(rpc *local.Local) error {
	ctx := context.Background()
	retries := 60
	for tries := retries; tries >= 0; tries-- {
		res, err := rpc.Status(ctx)
		if err != nil {
			time.Sleep(10 * time.Second)
			continue
		}

		if res.SyncInfo.CatchingUp {
			c.logger.Infof("comet catching up: latest seen block %d", res.SyncInfo.LatestBlockHeight)
			time.Sleep(10 * time.Second)
			continue
		}

		// no health error nor catching up
		// change internal rpc to local instead of http
		c.rpc = rpc
		return nil
	}
	return errors.New("timeout waiting for comet to catch up")
}
