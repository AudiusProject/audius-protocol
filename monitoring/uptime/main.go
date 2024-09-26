package main

import (
	"context"

	"github.com/AudiusProject/audius-protocol/core/common"
	"github.com/AudiusProject/audius-protocol/uptime/uptime_pkg"
)

func main() {
	ctx := context.Background()
	logger := common.NewLogger(nil)

	uptime_pkg.Run(ctx, logger)
}
