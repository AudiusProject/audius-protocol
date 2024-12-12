// Keeps the validators updated in cometbft and core up to date with what is present on the ethereum node registry.
package server

import (
	"context"
	"errors"
	"fmt"

	"github.com/AudiusProject/audius-protocol/pkg/core/accounts"
	"github.com/AudiusProject/audius-protocol/pkg/core/common"
	"github.com/AudiusProject/audius-protocol/pkg/core/db"
	"github.com/AudiusProject/audius-protocol/pkg/core/gen/core_proto"
	"github.com/jackc/pgx/v5"
	"google.golang.org/protobuf/proto"
)

// checks if the register node event is valid
// calls ethereum mainnet and validates signature to confirm node should be a validator
func (s *Server) isValidRegisterNodeEvent(ctx context.Context, e *core_proto.SignedTransaction) error {
	sig := e.GetSignature()
	if sig == "" {
		return fmt.Errorf("no signature provided for finalizeRegisterNode: %v", e)
	}

	event := e.GetValidatorRegistration()
	if event == nil {
		return fmt.Errorf("unknown event fell into finalizeRegisterNode: %v", e)
	}

	spf, err := s.contracts.GetServiceProviderFactoryContract()
	if err != nil {
		return fmt.Errorf("could not get spf contract to validate node event: %v", err)
	}

	spID, err := spf.GetServiceProviderIdFromEndpoint(nil, event.GetEndpoint())
	if err != nil {
		return fmt.Errorf("node attempted to register but not SP: %v", err)
	}

	serviceType := common.Utf8ToHex(event.GetNodeType())

	info, err := spf.GetServiceEndpointInfo(nil, serviceType, spID)
	if err != nil {
		return fmt.Errorf("node info not available %v: %v", spID, err)
	}

	// compare on chain info to requested comet data
	onChainOwnerWallet := info.DelegateOwnerWallet.Hex()
	onChainBlockNumber := info.BlockNumber.String()
	onChainEndpoint := info.Endpoint

	data, err := proto.Marshal(event)
	if err != nil {
		return fmt.Errorf("could not marshal event: %v", err)
	}

	_, address, err := accounts.EthRecover(e.GetSignature(), data)
	if err != nil {
		return fmt.Errorf("could not recover msg sig: %v", err)
	}

	eventOwnerWallet := address
	eventEndpoint := event.GetEndpoint()
	eventEthBlock := event.GetEthBlock()

	if onChainOwnerWallet != eventOwnerWallet {
		return fmt.Errorf("wallet %s tried to register %s as %s", eventOwnerWallet, onChainOwnerWallet, event.Endpoint)
	}

	if onChainBlockNumber != eventEthBlock {
		return fmt.Errorf("block number mismatch: %s %s", onChainBlockNumber, eventEthBlock)
	}

	if onChainEndpoint != eventEndpoint {
		return fmt.Errorf("endpoints don't match: %s %s", onChainEndpoint, eventEndpoint)
	}

	qtx := s.getDb()
	_, err = qtx.GetRegisteredNodeByEthAddress(ctx, eventOwnerWallet)
	if err == nil {
		return fmt.Errorf("already registered")
	} else if !errors.Is(err, pgx.ErrNoRows) {
		return fmt.Errorf("failed to check db for registration status: %v", err)
	}

	return nil
}

// persists the register node request should it pass validation
func (s *Server) finalizeRegisterNode(ctx context.Context, e *core_proto.SignedTransaction) (*core_proto.ValidatorRegistration, error) {
	if err := s.isValidRegisterNodeEvent(ctx, e); err != nil {
		return nil, fmt.Errorf("invalid register node event: %v", err)
	}

	qtx := s.getDb()

	event := e.GetValidatorRegistration()
	sig := e.GetSignature()
	eventBytes, err := proto.Marshal(event)
	if err != nil {
		return nil, fmt.Errorf("could not unmarshal event bytes: %v", err)
	}

	pubKey, address, err := accounts.EthRecover(sig, eventBytes)
	if err != nil {
		return nil, fmt.Errorf("could not recover signer: %v", err)
	}

	serializedPubKey, err := accounts.SerializePublicKey(pubKey)
	if err != nil {
		return nil, fmt.Errorf("could not serialize pubkey: %v", err)
	}

	registerNode := e.GetValidatorRegistration()

	err = qtx.InsertRegisteredNode(ctx, db.InsertRegisteredNodeParams{
		PubKey:       serializedPubKey,
		EthAddress:   address,
		Endpoint:     registerNode.GetEndpoint(),
		CometAddress: registerNode.GetCometAddress(),
		EthBlock:     registerNode.GetEthBlock(),
		NodeType:     registerNode.GetNodeType(),
		SpID:         registerNode.GetSpId(),
	})

	if err != nil {
		return nil, fmt.Errorf("error inserting registered node: %v", err)
	}

	return event, nil
}
