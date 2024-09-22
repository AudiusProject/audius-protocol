//go:generate templ generate

package console

import (
	"strings"

	"github.com/AudiusProject/audius-protocol/core/common"
	"github.com/AudiusProject/audius-protocol/core/config"
	"github.com/AudiusProject/audius-protocol/core/console/middleware"
	"github.com/AudiusProject/audius-protocol/core/console/views"
	"github.com/AudiusProject/audius-protocol/core/db"
	"github.com/cometbft/cometbft/rpc/client"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
)

const baseURL = "/console"

type Console struct {
	config *config.Config
	rpc    client.Client
	db     *db.Queries
	e      *echo.Echo
	logger *common.Logger
	views  *views.Views
}

func NewConsole(config *config.Config, logger *common.Logger, e *echo.Echo, rpc client.Client, pool *pgxpool.Pool) (*Console, error) {
	baseURL := "/console"

	c := &Console{
		config: config,
		rpc:    rpc,
		e:      e,
		logger: logger.Child(strings.TrimPrefix(baseURL, "/")),
		db:     db.New(pool),
		views:  views.NewViews(config, baseURL),
	}

	c.registerRoutes(logger, e.Group(baseURL))

	return c, nil
}

func (c *Console) registerRoutes(logger *common.Logger, groups ...*echo.Group) {
	for _, g := range groups {
		g.Use(middleware.JsonExtensionMiddleware)
		g.Use(middleware.ErrorLoggerMiddleware(logger))

		g.GET("/block/:block", c.blockPage)
	}
}
