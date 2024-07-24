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
	"github.com/dgraph-io/badger/v4"
)

func main() {
	logger := common.NewLogger(nil)

	// TODO: read from .env
	config, err := config.ReadConfig(logger)
	if err != nil {
		logger.Errorf("reading in config: %v", err)
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

	// generate node_key.json and priv_validator_key.json

	// write genesis file from embed

	// create config from go instead of toml

	// run one comet instance locally per content and discovery replica (4 i think)

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
