package chain

import (
	"context"
	"errors"
	"fmt"

	gen_proto "github.com/AudiusProject/audius-protocol/pkg/core/gen/core_proto"
	"google.golang.org/protobuf/proto"
)

func (core *CoreApplication) validateManageEntity(_ context.Context, stx *gen_proto.SignedTransaction) (proto.Message, error) {
	manageEntity := stx.GetManageEntity()
	if manageEntity == nil {
		return nil, errors.New("not manage entity")
	}
	return manageEntity, nil
}

func (core *CoreApplication) finalizeManageEntity(ctx context.Context, stx *gen_proto.SignedTransaction) (proto.Message, error) {
	tx, err := core.validateManageEntity(ctx, stx)
	if err != nil {
		return nil, fmt.Errorf("invalid manage entity: %v", err)
	}

	manageEntity := tx.(*gen_proto.ManageEntityLegacy)

	return manageEntity, nil
}
