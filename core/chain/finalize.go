package chain

import (
	"context"
	"fmt"

	gen_proto "github.com/AudiusProject/audius-protocol/core/gen/proto"
)

func (core *CoreApplication) finalizeEvent(ctx context.Context, msg *gen_proto.Event) error {
	switch t := msg.Body.(type) {
	case *gen_proto.Event_Plays:
		return nil
	case *gen_proto.Event_RegisterNode:
		return core.finalizeRegisterNode(ctx, msg)
	default:
		return fmt.Errorf("unhandled proto event: %v %T", msg, t)
	}
}
