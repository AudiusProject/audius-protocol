package server

import (
	"github.com/AudiusProject/audius-protocol/core/common"
	"github.com/AudiusProject/audius-protocol/core/config"
	"github.com/AudiusProject/audius-protocol/core/db"
	cconfig "github.com/cometbft/cometbft/config"
	"github.com/cometbft/cometbft/rpc/client/local"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
)

type Server struct {
	config  *config.Config
	cconfig *cconfig.Config
	logger  *common.Logger
	rpc     *local.Local
	db      *db.Queries
}

func NewServer(config *config.Config, cconfig *cconfig.Config, logger *common.Logger, rpc *local.Local, pool *pgxpool.Pool, e *echo.Echo) (*Server, error) {
	s := &Server{
		config:  config,
		cconfig: cconfig,
		rpc:     rpc,
		logger:  logger,
		db:      db.New(pool),
	}

	s.registerSystemRoutes(e)

	return s, nil
}

func (s *Server) registerSystemRoutes(e *echo.Echo) {
	g := e.Group("/system")

	g.GET("/genesis.json", s.getGenesisJSON)
}
