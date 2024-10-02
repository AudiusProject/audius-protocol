package chain

import (
	"context"
	"errors"
	"fmt"

	gen_proto "github.com/AudiusProject/audius-protocol/pkg/core/gen/proto"
)

func (core *CoreApplication) isValidPlayTransaction(_ context.Context, _ *gen_proto.SignedTransaction) error {
	return nil
}

func (core *CoreApplication) finalizePlayTransaction(ctx context.Context, stx *gen_proto.SignedTransaction) (*gen_proto.TrackPlays, error) {
	if err := core.isValidPlayTransaction(ctx, stx); err != nil {
		return nil, fmt.Errorf("invalid play tx: %v", err)
	}

	tx := stx.GetPlays()
	if tx == nil {
		return nil, errors.New("invalid play tx")
	}

	return tx, nil
}
