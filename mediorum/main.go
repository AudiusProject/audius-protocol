package main

import (
	"context"

	"github.com/AudiusProject/audius-protocol/core/common"
	"github.com/AudiusProject/audius-protocol/mediorum/mediorum_pkg"
)

func main() {
	ctx := context.Background()
	logger := common.NewLogger(nil)

	mediorum_pkg.Run(ctx, logger)
}
