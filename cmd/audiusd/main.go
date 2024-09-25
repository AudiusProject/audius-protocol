package main

import (
	"github.com/AudiusProject/audius-protocol/core/common"
	"github.com/AudiusProject/audius-protocol/core/core_pkg"
)

func main() {
	// run forever, no crashloops
	logger := common.NewLogger(nil)
	if err := core_pkg.Run(logger); err != nil {
		logger.Errorf("fatal core error: %v", err)
	}
	select {}
}
