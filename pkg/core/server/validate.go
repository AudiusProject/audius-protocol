package server

import (
	"github.com/AudiusProject/audius-protocol/pkg/core/gen/core_proto"
)

func (s *Server) validateTxGRPC(stx *core_proto.SignedTransaction) error {
	switch tx := stx.Transaction.(type) {
	case *core_proto.SignedTransaction_ValidatorRegistration:
		return s.validateNotJailed(tx)
	}
	return nil
}
