package server

import (
	"context"
	"fmt"

	"github.com/AudiusProject/audius-protocol/pkg/core/common"
	"github.com/AudiusProject/audius-protocol/pkg/core/config"
	"github.com/AudiusProject/audius-protocol/pkg/core/contracts"
	"github.com/AudiusProject/audius-protocol/pkg/core/db"
	"github.com/AudiusProject/audius-protocol/pkg/core/grpc"
	"github.com/AudiusProject/audius-protocol/pkg/core/mempool"
	"github.com/AudiusProject/audius-protocol/pkg/core/pubsub"
	"github.com/AudiusProject/audius-protocol/pkg/core/sdk"
	cconfig "github.com/cometbft/cometbft/config"
	nm "github.com/cometbft/cometbft/node"
	"github.com/cometbft/cometbft/rpc/client/local"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"golang.org/x/sync/errgroup"
)

type Server struct {
	config         *config.Config
	cometbftConfig *cconfig.Config
	logger         *common.Logger

	httpServer *echo.Echo
	grpcServer *grpc.GRPCServer
	pool       *pgxpool.Pool
	contracts  *contracts.AudiusContracts

	db    *db.Queries
	eth   *ethclient.Client
	node  *nm.Node
	rpc   *local.Local
	peers []*sdk.Sdk
	mempl *mempool.Mempool

	txPubsub *pubsub.TransactionHashPubsub

	abciState *ABCIState
}

func NewServer(config *config.Config, cconfig *cconfig.Config, logger *common.Logger, pool *pgxpool.Pool, eth *ethclient.Client) (*Server, error) {
	// create mempool
	mempl := mempool.NewMempool(logger, config, db.New(pool), cconfig.Mempool.Size)

	// TODO: don't do this immediately
	mempl.CreateValidatorClients()

	// create pubsubs
	txPubsub := pubsub.NewPubsub[struct{}]()

	// create contracts
	contracts, err := contracts.NewAudiusContracts(eth, config.EthRegistryAddress)
	if err != nil {
		return nil, fmt.Errorf("contracts init error: %v", err)
	}

	// create grpc server
	grpcServer, err := grpc.NewGRPCServer(logger, config, rpc, pool, mempl, txPubsub)
	if err != nil {
		return nil, fmt.Errorf("grpc init error: %v", err)
	}

	// create http server
	httpServer := echo.New()
	httpServer.Pre(middleware.RemoveTrailingSlash())
	httpServer.Use(middleware.Recover())
	httpServer.HideBanner = true

	s := &Server{
		config:         config,
		cometbftConfig: cconfig,
		logger:         logger.Child("server"),

		httpServer: httpServer,
		grpcServer: grpcServer,
		pool:       pool,
		contracts:  contracts,

		db:        db.New(pool),
		eth:       eth,
		mempl:     mempl,
		peers:     []*sdk.Sdk{},
		txPubsub:  txPubsub,
		abciState: NewABCIState(),
	}

	return s, nil
}

func (s *Server) startEchoServer() error {
	s.logger.Info("core HTTP server starting")
	s.registerRoutes()
	return s.httpServer.Start(s.config.CoreServerAddr)
}

func (s *Server) GetEcho() *echo.Echo {
	return s.httpServer
}

func (s *Server) Start(ctx context.Context) error {
	g, _ := errgroup.WithContext(ctx)

	g.Go(s.startABCI)
	g.Go(s.startGRPC)
	g.Go(s.startRegistryBridge)
	g.Go(s.startEchoServer)
	g.Go(s.startSyncTasks)
	g.Go(s.startPeerManager)

	return g.Wait()
}

func (s *Server) Shutdown(ctx context.Context) error {
	s.logger.Info("shutting down all services...")

	g, ctx := errgroup.WithContext(ctx)

	g.Go(func() error { return s.httpServer.Shutdown(ctx) })
	g.Go(s.node.Stop)
	g.Go(func() error {
		s.grpcServer.GetServer().GracefulStop()
		return nil
	})

	return g.Wait()
}
