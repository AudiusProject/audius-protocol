package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"

	"github.com/AudiusProject/audius-protocol/core/chain"
	"github.com/AudiusProject/audius-protocol/core/common"
	"github.com/AudiusProject/audius-protocol/core/config"
	"github.com/AudiusProject/audius-protocol/core/db"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	logger := common.NewLogger(nil)

	// core config
	config, err := config.ReadConfig(logger)
	if err != nil {
		logger.Errorf("reading in config: %v", err)
		return
	}

	// db migrations
	if err := db.RunMigrations(logger, config.PSQLConn, config.RunDownMigration); err != nil {
		logger.Errorf("running migrations: %v", err)
		return
	}

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

	node.Start()
	defer func() {
		node.Stop()
		node.Wait()
	}()

	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	<-c

}
