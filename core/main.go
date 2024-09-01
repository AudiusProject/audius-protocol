package main

import (
	"github.com/AudiusProject/audius-protocol/core/common"
)

func main() {
	// run forever, no crashloops
	logger := common.NewLogger(nil)
	if err := run(logger); err != nil {
		logger.Errorf("fatal: %v", err)
	}
	select {}
}
