package chain

import (
	"context"
	"errors"
	"fmt"

	"github.com/AudiusProject/audius-protocol/pkg/core/gen/core_proto"
)

func (core *CoreApplication) isValidPlayTransaction(_ context.Context, _ *core_proto.SignedTransaction) error {
	return nil
}

func (core *CoreApplication) finalizePlayTransaction(ctx context.Context, stx *core_proto.SignedTransaction) (*core_proto.TrackPlays, error) {
	if err := core.isValidPlayTransaction(ctx, stx); err != nil {
		return nil, fmt.Errorf("invalid play tx: %v", err)
	}

	tx := stx.GetPlays()
	if tx == nil {
		return nil, errors.New("invalid play tx")
	}

	core.logger.Infof("finalizing play tx: %v", tx)

	return tx, nil
}
