package server

import (
	"context"
	"errors"
	"fmt"

	"github.com/AudiusProject/audius-protocol/pkg/core/gen/core_proto"
	"google.golang.org/protobuf/proto"
)

func (s *Server) validateManageEntity(_ context.Context, stx *core_proto.SignedTransaction) (proto.Message, error) {
	manageEntity := stx.GetManageEntity()
	if manageEntity == nil {
		return nil, errors.New("not manage entity")
	}
	return manageEntity, nil
}

func (s *Server) finalizeManageEntity(ctx context.Context, stx *core_proto.SignedTransaction) (proto.Message, error) {
	tx, err := s.validateManageEntity(ctx, stx)
	if err != nil {
		return nil, fmt.Errorf("invalid manage entity: %v", err)
	}

	manageEntity := tx.(*core_proto.ManageEntityLegacy)

	return manageEntity, nil
}
