package core

import (
	"context"
	"fmt"
	_ "net/http/pprof"

	"github.com/AudiusProject/audius-protocol/pkg/core/common"
	"github.com/AudiusProject/audius-protocol/pkg/core/config"
	"github.com/AudiusProject/audius-protocol/pkg/core/console"
	"github.com/AudiusProject/audius-protocol/pkg/core/db"
	"github.com/AudiusProject/audius-protocol/pkg/core/server"

	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/jackc/pgx/v5/pgxpool"
)

func Run(ctx context.Context, logger *common.Logger) error {
	return run(ctx, logger)
}

func run(ctx context.Context, logger *common.Logger) error {
	logger.Info("good morning!")

	config, cometConfig, err := config.SetupNode(logger)
	if err != nil {
		return fmt.Errorf("setting up node: %v", err)
	}

	logger.Info("configuration created")

	// db migrations
	if err := db.RunMigrations(logger, config.PSQLConn, config.RunDownMigrations()); err != nil {
		return fmt.Errorf("running migrations: %v", err)
	}

	logger.Info("db migrations successful")

	// Use the passed context for the pool
	pool, err := pgxpool.New(ctx, config.PSQLConn)
	if err != nil {
		return fmt.Errorf("couldn't create pgx pool: %v", err)
	}
	defer pool.Close()

	ethrpc, err := ethclient.Dial(config.EthRPCUrl)
	if err != nil {
		return fmt.Errorf("eth client dial err: %v", err)
	}
	defer ethrpc.Close()

	s, err := server.NewServer(config, cometConfig, logger, pool, ethrpc)
	if err != nil {
		return fmt.Errorf("server init error: %v", err)
	}

	// console gets run from core(main).go since it is an isolated go module
	// unlike the other modules that register themselves on the echo http server
	if config.ConsoleModule {
		e := s.GetEcho()
		con, err := console.NewConsole(config, logger, e, pool)
		if err != nil {
			logger.Errorf("console init error: %v", err)
			return err
		}
		go func() {
			logger.Info("core console starting")
			if err := con.Start(); err != nil {
				logger.Errorf("console couldn't start or crashed: %v", err)
				return
			}
		}()
	}

	if err := s.Start(ctx); err != nil {
		logger.Errorf("something crashed: %v", err)
		return err
	}

	return s.Shutdown(ctx)
}
