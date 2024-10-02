package main

import (
	"context"

	"github.com/AudiusProject/audius-protocol/pkg/core"
	"github.com/AudiusProject/audius-protocol/pkg/core/common"
)

func main() {
	logger := common.NewLogger(nil)
	ctx := context.Background()

	if err := core.Run(ctx, logger); err != nil {
		logger.Errorf("fatal core error: %v", err)
	}
}
