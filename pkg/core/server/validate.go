package server

import (
	"context"
	"fmt"

	"github.com/AudiusProject/audius-protocol/pkg/core/gen/core_proto"
)

func (s *Server) validateTx(stx *core_proto.SignedTransaction) error {
	switch tx := stx.Transaction.(type) {
	case *core_proto.SignedTransaction_ValidatorRegistration:
		return s.validateValidatorRegistration(tx)

	}
	return nil
}

func (s *Server) validateValidatorRegistration(tx *core_proto.SignedTransaction_ValidatorRegistration) error {
	db := s.db

	cometAddr := tx.ValidatorRegistration.CometAddress

	node, err := db.GetRegisteredNodeByCometAddress(context.Background(), cometAddr)
	if err != nil {
		return fmt.Errorf("validation db fail: %v", err)
	}

	jailed := node.Jailed
	if jailed.Bool {
		return fmt.Errorf("node %s is jailed and can't be re-registered", cometAddr)
	}

	return nil
}
