//go:generate templ generate

package console

import (
	"fmt"

	"github.com/AudiusProject/audius-protocol/core/common"
	"github.com/AudiusProject/audius-protocol/core/config"
	"github.com/AudiusProject/audius-protocol/core/console/middleware"
	"github.com/AudiusProject/audius-protocol/core/console/pages"
	"github.com/AudiusProject/audius-protocol/core/db"
	"github.com/cometbft/cometbft/rpc/client"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
)

type Console struct {
	config *config.Config
	rpc    client.Client
	db     *db.Queries
	e      *echo.Echo
	logger *common.Logger
}

func NewConsole(config *config.Config, logger *common.Logger, e *echo.Echo, rpc client.Client, pool *pgxpool.Pool) (*Console, error) {
	c := &Console{
		config: config,
		rpc:    rpc,
		e:      e,
		logger: logger.Child("console"),
		db:     db.New(pool),
	}

	consoleBase := e.Group("/console")

	c.registerRoutes(logger, consoleBase)

	_, err := pages.NewPages(config, logger, e, rpc, pool)
	if err != nil {
		return nil, fmt.Errorf("pages could not be created: %v", err)
	}

	return c, nil
}

func (c *Console) registerRoutes(logger *common.Logger, groups ...*echo.Group) {
	for _, g := range groups {
		g.Use(middleware.ErrorLoggerMiddleware(logger))
	}
}
