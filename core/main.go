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

	config := &common.Config{
		NodeConfig: common.NodeConfig{
			HomeDir: "./tmp/cometbft-home",
		},
	}

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
