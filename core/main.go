package main

import (
	"fmt"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"

	"github.com/AudiusProject/audius-protocol/core/chain"
	"github.com/AudiusProject/audius-protocol/core/common"
	"github.com/AudiusProject/audius-protocol/core/config"
	"github.com/AudiusProject/audius-protocol/core/db"
	"github.com/dgraph-io/badger/v4"
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
	if err := db.RunMigrations(logger, config.PSQLConn); err != nil {
		logger.Errorf("running migrations: %v", err)
		return
	}

	dbPath := filepath.Join(config.HomeDir, "badger")
	db, err := badger.Open(badger.DefaultOptions(dbPath))

	if err != nil {
		logger.Errorf("opening database: %v", err)
		return
	}
	defer func() {
		if err := db.Close(); err != nil {
			logger.Info(fmt.Sprintf("closing database: %v", err))
		}
	}()

	node, err := chain.NewNode(logger, config, db)
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
