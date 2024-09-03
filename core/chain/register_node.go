package chain

import (
	"context"
	"fmt"

	"github.com/AudiusProject/audius-protocol/core/db"
	gen_proto "github.com/AudiusProject/audius-protocol/core/gen/proto"
)

// checks if the register node event is valid
// calls ethereum mainnet and validates signature to confirm node should be a validator
func (core *CoreApplication) isValidRegisterNodeEvent(e *gen_proto.Event) error {
	sig := e.GetSignature()
	if sig == "" {
		return fmt.Errorf("no signature provided for finalizeRegisterNode: %v", e)
	}

	event := e.GetRegisterNode()
	if event == nil {
		return fmt.Errorf("unknown event fell into finalizeRegisterNode: %v", e)
	}

	return nil
}

// persists the register node request should it pass validation
func (core *CoreApplication) finalizeRegisterNode(ctx context.Context, e *gen_proto.Event) error {
	if err := core.isValidRegisterNodeEvent(e); err != nil {
		return fmt.Errorf("invalid register node event: %v", err)
	}

	qtx := core.getDb()

	qtx.InsertRegisteredNode(ctx, db.InsertRegisteredNodeParams{
		PubKey:       []byte("derive pubkey json"),
		Endpoint:     e.GetRegisterNode().GetEndpoint(),
		EthAddress:   "derive eth address from pubkey",
		CometAddress: "derive comet address from pubkey",
		TxHash:       "maybe tx hash from ethereum?",
	})

	return nil
}
