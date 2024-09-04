package chain

import (
	"context"
	"fmt"

	gen_proto "github.com/AudiusProject/audius-protocol/core/gen/proto"
)

func (core *CoreApplication) finalizeEvent(ctx context.Context, msg *gen_proto.Event) error {
	switch msg.Body.(type) {
	case *gen_proto.Event_Plays:
	case *gen_proto.Event_RegisterNode:
		return core.finalizeRegisterNode(ctx, msg)
	}
	return fmt.Errorf("unhandled proto event: %v", msg)
}
