package main

import (
	"context"

<<<<<<< HEAD
	"github.com/AudiusProject/audius-protocol/pkg/core/common"
=======
	"github.com/AudiusProject/audius-protocol/core/common"
>>>>>>> main
	"github.com/AudiusProject/audius-protocol/pkg/mediorum"
)

func main() {
	ctx := context.Background()
	logger := common.NewLogger(nil)

	mediorum.Run(ctx, logger)
}
