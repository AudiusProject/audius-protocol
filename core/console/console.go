//go:generate templ generate

package console

import (
	"github.com/AudiusProject/audius-protocol/core/common"
	"github.com/AudiusProject/audius-protocol/core/config"
	"github.com/AudiusProject/audius-protocol/core/console/components"
	"github.com/AudiusProject/audius-protocol/core/console/middleware"
	"github.com/AudiusProject/audius-protocol/core/db"
	"github.com/cometbft/cometbft/rpc/client/local"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
)

type Console struct {
	config *config.Config
	rpc    *local.Local
	db     *db.Queries
	e      *echo.Echo
	logger *common.Logger
	c      *components.Components
}

func NewConsole(config *config.Config, logger *common.Logger, e *echo.Echo, rpc *local.Local, pool *pgxpool.Pool) (*Console, error) {
	c := &Console{
		config: config,
		rpc:    rpc,
		e:      e,
		logger: logger.Child("console"),
		db:     db.New(pool),
		c:      components.NewComponents(config, rpc, db.New(pool)),
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

		g.GET("/headerinfo", c.headerInfo)
	}
}
