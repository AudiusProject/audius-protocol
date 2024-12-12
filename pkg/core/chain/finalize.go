package chain

import (
	"context"
	"fmt"
	"time"

	"github.com/AudiusProject/audius-protocol/pkg/core/db"
	"github.com/AudiusProject/audius-protocol/pkg/core/gen/core_proto"
	"github.com/AudiusProject/audius-protocol/pkg/core/grpc"
	"github.com/jackc/pgx/v5/pgtype"
	"google.golang.org/protobuf/proto"
)

func (core *CoreApplication) finalizeTransaction(ctx context.Context, msg *core_proto.SignedTransaction, txHash string) (proto.Message, error) {
	switch t := msg.Transaction.(type) {
	case *core_proto.SignedTransaction_Plays:
		return core.finalizePlayTransaction(ctx, msg)
	case *core_proto.SignedTransaction_ManageEntity:
		return core.finalizeManageEntity(ctx, msg)
	case *core_proto.SignedTransaction_ValidatorRegistration:
		return core.finalizeRegisterNode(ctx, msg)
	case *core_proto.SignedTransaction_SlaRollup:
		return core.finalizeSlaRollup(ctx, msg, txHash)
	default:
		return nil, fmt.Errorf("unhandled proto event: %v %T", msg, t)
	}
}

func (core *CoreApplication) persistTxStat(ctx context.Context, tx proto.Message, txhash string, height int64, blockTime time.Time) error {
	if err := core.getDb().InsertTxStat(ctx, db.InsertTxStatParams{
		TxType:      grpc.GetProtoTypeName(tx),
		TxHash:      txhash,
		BlockHeight: height,
		CreatedAt: pgtype.Timestamp{
			Time:  blockTime,
			Valid: true,
		},
	}); err != nil {
		core.logger.Error("error inserting tx stat", "error", err)
	}
	return nil
}
