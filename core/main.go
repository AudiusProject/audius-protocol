package main

import (
	"context"
	"net"

	"github.com/AudiusProject/audius-protocol/core/chain"
	"github.com/AudiusProject/audius-protocol/core/common"
	"github.com/AudiusProject/audius-protocol/core/config"
	"github.com/AudiusProject/audius-protocol/core/console"
	"github.com/AudiusProject/audius-protocol/core/db"
	"github.com/AudiusProject/audius-protocol/core/grpc"
	"github.com/cometbft/cometbft/rpc/client/local"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	"golang.org/x/sync/errgroup"
)

func main() {
	logger := common.NewLogger(nil)

	logger.Info("good morning!")

	// core config
	config, err := config.ReadConfig(logger)
	if err != nil {
		logger.Errorf("reading in config: %v", err)
		return
	}

	logger.Info("configuration created")

	// db migrations
	if err := db.RunMigrations(logger, config.PSQLConn, config.RunDownMigration); err != nil {
		logger.Errorf("running migrations: %v", err)
		return
	}

	logger.Info("db migrations successful")

	pool, err := pgxpool.New(context.Background(), config.PSQLConn)
	if err != nil {
		logger.Errorf("couldn't create pgx pool: %v", err)
		return
	}
	defer pool.Close()

	node, err := chain.NewNode(logger, config, pool)
	if err != nil {
		logger.Errorf("node init error: %v", err)
		return
	}

	logger.Info("new node created")

	rpc := local.New(node)

	logger.Info("local rpc initialized")

	server, err := grpc.NewGRPCServer(logger, config, rpc, pool)
	if err != nil {
		logger.Errorf("grpc init error: %v", err)
		return
	}

	logger.Info("grpc server created")

	e := echo.New()
	e.HideBanner = true

	_, err = console.NewConsole(config, logger, e, rpc, pool)
	if err != nil {
		logger.Errorf("console init error: %v", err)
		return
	}

	grpcLis, err := net.Listen("tcp", config.GRPCladdr)
	if err != nil {
		logger.Errorf("grpc listener not created: %v", err)
		return
	}

	eg, ctx := errgroup.WithContext(context.Background())

	// close all services if app exits
	defer e.Shutdown(ctx)
	defer node.Stop()
	defer grpcLis.Close()

	// console
	eg.Go(func() error {
		logger.Info("core http server starting")
		return e.Start(config.CoreServerAddr)
	})

	// cometbft
	eg.Go(func() error {
		logger.Info("core comet server starting")
		return node.Start()
	})

	// grpc
	eg.Go(func() error {
		logger.Info("core grpc server starting")
		return server.Serve(grpcLis)
	})

	if err := eg.Wait(); err != nil {
		logger.Errorf("error in errgroup: %v", err)
		return
	}
}
