package server

import (
	"github.com/AudiusProject/audius-protocol/pkg/core/common"
	"github.com/AudiusProject/audius-protocol/pkg/core/config"
	"github.com/AudiusProject/audius-protocol/pkg/core/contracts"
	"github.com/AudiusProject/audius-protocol/pkg/core/db"
	"github.com/AudiusProject/audius-protocol/pkg/core/mempool"
	"github.com/AudiusProject/audius-protocol/pkg/core/pubsub"
	"github.com/AudiusProject/audius-protocol/pkg/core/sdk"
	cconfig "github.com/cometbft/cometbft/config"
	nm "github.com/cometbft/cometbft/node"
	"github.com/cometbft/cometbft/rpc/client/local"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
)

type Server struct {
	config         *config.Config
	cometbftConfig *cconfig.Config
	logger         *common.Logger

	rpc       *local.Local
	peers     []*sdk.Sdk
	pool      *pgxpool.Pool
	db        *db.Queries
	contracts *contracts.AudiusContracts
	node      *nm.Node

	txPubsub *pubsub.TransactionHashPubsub

	mempl     *mempool.Mempool
	abciState ABCIState
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
	s.initializeABCI()

	return s, nil
}
