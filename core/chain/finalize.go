package chain

import (
	"context"
	"fmt"

	gen_proto "github.com/AudiusProject/audius-protocol/core/gen/proto"
)

func (core *CoreApplication) finalizeEvent(ctx context.Context, msg *gen_proto.SignedTransaction, txHash string) error {
	switch t := msg.Transaction.(type) {
	case *gen_proto.SignedTransaction_Plays:
		return nil
	case *gen_proto.SignedTransaction_ValidatorRegistration:
		return core.finalizeRegisterNode(ctx, msg)
	case *gen_proto.SignedTransaction_SlaRollup:
		return core.finalizeSlaRollup(ctx, msg, txHash)
	default:
		return fmt.Errorf("unhandled proto event: %v %T", msg, t)
	}
}
