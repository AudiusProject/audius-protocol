//go:generate templ generate

package console

import (
	"context"
	"net/http"

	"github.com/AudiusProject/audius-protocol/core/common"
	"github.com/AudiusProject/audius-protocol/core/config"
	"github.com/AudiusProject/audius-protocol/core/console/components"
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
}

func NewConsole(config *config.Config, logger *common.Logger, e *echo.Echo, rpc *local.Local, pool *pgxpool.Pool) (*Console, error) {
	c := &Console{
		config: config,
		rpc:    rpc,
		e:      e,
		logger: logger,
		db:     db.New(pool),
	}

	g := e.Group("/console")

	g.GET("/hello/:name", func(c echo.Context) error {
		name := c.Param("name")
		t := components.Hello(name)
		err := t.Render(context.Background(), c.Response().Writer)
		if err != nil {
			return c.String(http.StatusInternalServerError, "failed to render response template")
		}
		return nil
	})

	g.GET("/tx/:tx", c.txPage)

	return c, nil
}
