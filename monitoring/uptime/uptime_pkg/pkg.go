package uptime_pkg

import (
	"context"

	"github.com/AudiusProject/audius-protocol/core/common"
)

// TODO: wrap things for an easier diff leading up to pkg re-org
func Run(ctx context.Context, logger *common.Logger) error {
	logger.Info("Uptime.Run()")
	return run()
}
