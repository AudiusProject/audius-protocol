package main

import (
	"context"

	"github.com/AudiusProject/audius-protocol/core/common"
	"github.com/AudiusProject/audius-protocol/core/core_pkg"
)

func main() {
	logger := common.NewLogger(nil)
	ctx := context.Background()

	if err := core_pkg.Run(ctx, logger); err != nil {
		logger.Errorf("fatal core error: %v", err)
	}
}
