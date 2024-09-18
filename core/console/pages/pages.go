package pages

import (
	"github.com/AudiusProject/audius-protocol/core/common"
	"github.com/AudiusProject/audius-protocol/core/config"
	"github.com/AudiusProject/audius-protocol/core/console/components"
	"github.com/AudiusProject/audius-protocol/core/console/middleware"
	"github.com/AudiusProject/audius-protocol/core/db"
	"github.com/cometbft/cometbft/rpc/client"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
)

const routeBase = "test"

type Pages struct {
	config *config.Config
	rpc    client.Client
	db     *db.Queries
	e      *echo.Echo
	logger *common.Logger
	c      *components.Components
}

func NewPages(config *config.Config, logger *common.Logger, e *echo.Echo, rpc client.Client, pool *pgxpool.Pool) (*Pages, error) {
	c := &Pages{
		config: config,
		rpc:    rpc,
		e:      e,
		logger: logger.Child(routeBase),
		db:     db.New(pool),
		c:      components.NewComponents(config, rpc, db.New(pool)),
	}

	consoleBase := e.Group("/" + routeBase)

	c.registerRoutes(logger, consoleBase)

	return c, nil
}

func (c *Pages) registerRoutes(logger *common.Logger, groups ...*echo.Group) {
	for _, g := range groups {
		g.Use(middleware.JsonExtensionMiddleware)
		g.Use(middleware.ErrorLoggerMiddleware(logger))

		g.GET("/block/:block", c.blockPage)
	}
}
