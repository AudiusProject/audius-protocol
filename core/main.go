package main

import (
	"os"
	"os/signal"
	"syscall"

	"github.com/AudiusProject/audius-protocol/core/chain"
	"github.com/AudiusProject/audius-protocol/core/common"
)

func main() {
	logger := common.NewLogger(nil)

	// TODO: read from .env
	config := &common.Config{
		NodeConfig: common.NodeConfig{
			HomeDir: "./tmp/cometbft-home",
		},
	}

	// generate node_key.json and priv_validator_key.json

	// write genesis file from embed

	// create config from go instead of toml

	// change indexing db to postgres

	// run one comet instance locally per content and discovery replica (4 i think)

	node, err := chain.NewNode(logger, config)
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
