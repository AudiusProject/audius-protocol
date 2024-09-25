package core_pkg

import (
	"context"

	"github.com/AudiusProject/audius-protocol/core/common"
)

// TODO: wrap things for an easier diff leading up to pkg re-org
func Run(ctx context.Context, logger *common.Logger) error {
	return run(ctx, logger)
}
