package main

import (
	"github.com/cometbft/cometbft-load-test/pkg/loadtest"
)

// stub, fill out when abci is done
func main() {
	if err := loadtest.RegisterClientFactory("audius-loadtest", nil); err != nil {
		panic(err)
	}

	loadtest.Run(&loadtest.CLIConfig{})
}
