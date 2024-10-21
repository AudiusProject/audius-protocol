//go:generate templ generate

package console

import (
	"fmt"
	"strings"

	"github.com/AudiusProject/audius-protocol/pkg/core/common"
	"github.com/AudiusProject/audius-protocol/pkg/core/config"
	"github.com/AudiusProject/audius-protocol/pkg/core/console/views"
	"github.com/AudiusProject/audius-protocol/pkg/core/console/views/layout"
	"github.com/AudiusProject/audius-protocol/pkg/core/db"
	"github.com/cometbft/cometbft/rpc/client"
	rpchttp "github.com/cometbft/cometbft/rpc/client/http"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
)

type Console struct {
	config *config.Config
	rpc    client.Client
	db     *db.Queries
	e      *echo.Echo
	logger *common.Logger

	state   *State
	layouts *layout.Layout
	views   *views.Views
}

func NewConsole(config *config.Config, logger *common.Logger, e *echo.Echo, pool *pgxpool.Pool) (*Console, error) {
	db := db.New(pool)
	httprpc, err := rpchttp.New(config.RPCladdr)
	if err != nil {
		return nil, fmt.Errorf("could not create rpc client: %v", err)
	}
	state, err := NewState(config, httprpc, logger, db)
	if err != nil {
		return nil, err
	}
	c := &Console{
		config:  config,
		rpc:     httprpc,
		e:       e,
		logger:  logger.Child(strings.TrimPrefix(baseURL, "/")),
		db:      db,
		state:   state,
		views:   views.NewViews(config, baseURL),
		layouts: layout.NewLayout(config, baseURL),
	}

	c.registerRoutes(logger, e)

	return c, nil
}

func (c *Console) Start() error {
	return c.state.Start()
}
