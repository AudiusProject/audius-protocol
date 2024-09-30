package main

import (
	"context"
	"fmt"
	"net"

	"github.com/AudiusProject/audius-protocol/core/chain"
	"github.com/AudiusProject/audius-protocol/core/common"
	"github.com/AudiusProject/audius-protocol/core/console"
	"github.com/AudiusProject/audius-protocol/core/contracts"
	"github.com/AudiusProject/audius-protocol/core/db"
	"github.com/AudiusProject/audius-protocol/core/grpc"
	"github.com/AudiusProject/audius-protocol/core/registry_bridge"
	"github.com/AudiusProject/audius-protocol/core/server"
	rpchttp "github.com/cometbft/cometbft/rpc/client/http"
	"github.com/cometbft/cometbft/rpc/client/local"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"golang.org/x/sync/errgroup"
)

func run(logger *common.Logger) error {
	logger.Info("good morning!")

	config, cometConfig, err := setupNode(logger)
	if err != nil {
		return fmt.Errorf("setting up node: %v", err)
	}

	logger.Info("configuration created")

	// db migrations
	if err := db.RunMigrations(logger, config.PSQLConn, config.RunDownMigrations()); err != nil {
		return fmt.Errorf("running migrations: %v", err)
	}

	logger.Info("db migrations successful")

	pool, err := pgxpool.New(context.Background(), config.PSQLConn)
	if err != nil {
		return fmt.Errorf("couldn't create pgx pool: %v", err)
	}
	defer pool.Close()

	e := echo.New()
	e.Pre(middleware.RemoveTrailingSlash())
	e.Use(middleware.Recover())
	e.HideBanner = true

	if config.StandaloneConsole && cometConfig == nil {
		httprpc, err := rpchttp.New(config.RPCladdr)
		if err != nil {
			return fmt.Errorf("could not create rpc client: %v", err)
		}

		// run console in isolation
		_, err = console.NewConsole(config, logger, e, httprpc, pool)
		if err != nil {
			return fmt.Errorf("console init error: %v", err)
		}

		defer e.Shutdown(context.Background())
		return e.Start(config.CoreServerAddr)
	}

	ethrpc, err := ethclient.Dial(config.EthRPCUrl)
	if err != nil {
		return fmt.Errorf("eth client dial err: %v", err)
	}

	c, err := contracts.NewAudiusContracts(ethrpc, config.EthRegistryAddress)
	if err != nil {
		return fmt.Errorf("contracts init error: %v", err)
	}
	logger.Info("initialized contracts")

	node, err := chain.NewNode(logger, config, cometConfig, pool, c)
	if err != nil {
		return fmt.Errorf("node init error: %v", err)
	}

	logger.Info("new node created")

	rpc := local.New(node)

	logger.Info("local rpc initialized")

	registryBridge, err := registry_bridge.NewRegistryBridge(logger, config, rpc, c, pool)
	if err != nil {
		return fmt.Errorf("registry bridge init error: %v", err)
	}

	_, err = server.NewServer(config, node.Config(), logger, rpc, pool, e)
	if err != nil {
		return fmt.Errorf("server init error: %v", err)
	}

	_, err = console.NewConsole(config, logger, e, rpc, pool)
	if err != nil {
		return fmt.Errorf("console init error: %v", err)
	}

	grpcServer, err := grpc.NewGRPCServer(logger, config, rpc, pool)
	if err != nil {
		return fmt.Errorf("grpc init error: %v", err)
	}

	logger.Info("grpc server created")

	grpcLis, err := net.Listen("tcp", config.GRPCladdr)
	if err != nil {
		return fmt.Errorf("grpc listener not created: %v", err)
	}

	eg, ctx := errgroup.WithContext(context.Background())

	// close all services if app exits
	defer e.Shutdown(ctx)
	defer node.Stop()
	defer grpcLis.Close()
	defer ethrpc.Close()

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
		return grpcServer.Serve(grpcLis)
	})

	// registry bridge
	eg.Go(func() error {
		logger.Info("core registry bridge starting")
		return registryBridge.Start()
	})

	return eg.Wait()
}
