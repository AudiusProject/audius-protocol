package main

import (
	"context"

	"github.com/AudiusProject/audius-protocol/pkg/core/common"
	"github.com/AudiusProject/audius-protocol/pkg/mediorum"
)

func main() {
	ctx := context.Background()
	logger := common.NewLogger(nil)

	mediorum.Run(ctx, logger)
}
