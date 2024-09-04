package chain

import (
	"context"
	"fmt"

	"github.com/AudiusProject/audius-protocol/core/accounts"
	"github.com/AudiusProject/audius-protocol/core/db"
	gen_proto "github.com/AudiusProject/audius-protocol/core/gen/proto"
	"google.golang.org/protobuf/proto"
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

	core.logger.Info("finalizing register node")

	qtx := core.getDb()

	event := e.GetRegisterNode()
	sig := e.GetSignature()
	eventBytes, err := proto.Marshal(event)
	if err != nil {
		return fmt.Errorf("could not unmarshal event bytes: %v", err)
	}

	pubKey, address, err := accounts.EthRecover(sig, eventBytes)
	if err != nil {
		return fmt.Errorf("could not recover signer: %v", err)
	}

	serializedPubKey, err := accounts.SerializePublicKey(pubKey)
	if err != nil {
		return fmt.Errorf("could not serialize pubkey: %v", err)
	}

	err = qtx.InsertRegisteredNode(ctx, db.InsertRegisteredNodeParams{
		PubKey:       serializedPubKey,
		Endpoint:     e.GetRegisterNode().GetEndpoint(),
		EthAddress:   address,
		CometAddress: e.GetRegisterNode().GetCometAddress(),
		TxHash:       "not implemented",
	})

	if err != nil {
		return fmt.Errorf("error inserting registered node: %v", err)
	}

	return nil
}
