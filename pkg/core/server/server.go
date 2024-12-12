package server

import (
	"github.com/AudiusProject/audius-protocol/pkg/core/common"
	"github.com/AudiusProject/audius-protocol/pkg/core/config"
	"github.com/AudiusProject/audius-protocol/pkg/core/db"
	"github.com/AudiusProject/audius-protocol/pkg/core/mempool"
	"github.com/AudiusProject/audius-protocol/pkg/core/sdk"
	cconfig "github.com/cometbft/cometbft/config"
	"github.com/cometbft/cometbft/rpc/client/local"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
)

type Server struct {
	config         *config.Config
	cometbftConfig *cconfig.Config
	logger         *common.Logger
	rpc            *local.Local
	db             *db.Queries
	mempl          *mempool.Mempool
	peers          []*sdk.Sdk
}

func NewServer(config *config.Config, cconfig *cconfig.Config, logger *common.Logger, rpc *local.Local, pool *pgxpool.Pool, e *echo.Echo, mempl *mempool.Mempool) (*Server, error) {
	s := &Server{
		config:         config,
		cometbftConfig: cconfig,
		rpc:            rpc,
		logger:         logger.Child("http_server"),
		db:             db.New(pool),
		mempl:          mempl,
		peers:          []*sdk.Sdk{},
	}

	s.registerRoutes(e)

	return s, nil
}
