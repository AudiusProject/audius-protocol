//go:generate templ generate

package console

import (
	"strings"

	"github.com/AudiusProject/audius-protocol/core/common"
	"github.com/AudiusProject/audius-protocol/core/config"
	"github.com/AudiusProject/audius-protocol/core/console/views"
	"github.com/AudiusProject/audius-protocol/core/console/views/layout"
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

	layouts *layout.Layout
	views   *views.Views
}

func NewConsole(config *config.Config, logger *common.Logger, e *echo.Echo, rpc client.Client, pool *pgxpool.Pool) (*Console, error) {
	c := &Console{
		config:  config,
		rpc:     rpc,
		e:       e,
		logger:  logger.Child(strings.TrimPrefix(baseURL, "/")),
		db:      db.New(pool),
		views:   views.NewViews(config, baseURL),
		layouts: layout.NewLayout(config, baseURL),
	}

	c.registerRoutes(logger, e)

	return c, nil
}
