package chain

import (
	"context"
	"errors"
	"fmt"

	"github.com/AudiusProject/audius-protocol/pkg/core/accounts"
	"github.com/AudiusProject/audius-protocol/pkg/core/common"
	"github.com/AudiusProject/audius-protocol/pkg/core/db"
	gen_proto "github.com/AudiusProject/audius-protocol/pkg/core/gen/proto"
	"github.com/cometbft/cometbft/crypto/ed25519"
	"github.com/jackc/pgx/v5"
	"google.golang.org/protobuf/proto"
)

// checks if the register node tx is valid
// calls ethereum mainnet and validates signature to confirm node should be a validator
func (core *CoreApplication) isValidRegisterNodeTx(ctx context.Context, tx *gen_proto.SignedTransaction) error {
	sig := tx.GetSignature()
	if sig == "" {
		return fmt.Errorf("no signature provided for finalizeRegisterNode: %v", tx)
	}

	vr := tx.GetValidatorRegistration()
	if vr == nil {
		return fmt.Errorf("unknown tx fell into finalizeRegisterNode: %v", tx)
	}

	spf, err := core.contracts.GetServiceProviderFactoryContract()
	if err != nil {
		return fmt.Errorf("could not get spf contract to validate node tx: %v", err)
	}

	spID, err := spf.GetServiceProviderIdFromEndpoint(nil, vr.GetEndpoint())
	if err != nil {
		return fmt.Errorf("node attempted to register but not SP: %v", err)
	}

	serviceType := common.Utf8ToHex(vr.GetNodeType())

	info, err := spf.GetServiceEndpointInfo(nil, serviceType, spID)
	if err != nil {
		return fmt.Errorf("node info not available %v: %v", spID, err)
	}

	// compare on chain info to requested comet data
	onChainOwnerWallet := info.DelegateOwnerWallet.Hex()
	onChainBlockNumber := info.BlockNumber.String()
	onChainEndpoint := info.Endpoint

	data, err := proto.Marshal(vr)
	if err != nil {
		return fmt.Errorf("could not marshal transaction: %v", err)
	}

	_, address, err := accounts.EthRecover(tx.GetSignature(), data)
	if err != nil {
		return fmt.Errorf("could not recover msg sig: %v", err)
	}

	vrOwnerWallet := address
	vrEndpoint := vr.GetEndpoint()
	vrEthBlock := vr.GetEthBlock()
	vrCometAddress := vr.GetCometAddress()
	vrPubKey := ed25519.PubKey(vr.GetPubKey())
	vrPower := int(vr.GetPower())

	if onChainOwnerWallet != vrOwnerWallet {
		return fmt.Errorf("wallet %s tried to register %s as %s", vrOwnerWallet, onChainOwnerWallet, vr.Endpoint)
	}

	if onChainBlockNumber != vrEthBlock {
		return fmt.Errorf("block number mismatch: %s %s", onChainBlockNumber, vrEthBlock)
	}

	if onChainEndpoint != vrEndpoint {
		return fmt.Errorf("endpoints don't match: %s %s", onChainEndpoint, vrEndpoint)
	}

	if vrPubKey.Address().String() != vrCometAddress {
		return fmt.Errorf("address does not match public key: %s %s", vrPubKey.Address(), vrCometAddress)
	}

	if vrPower != core.config.ValidatorVotingPower {
		return fmt.Errorf("Invalid voting power '%d'", vrPower)
	}

	qtx := core.getDb()
	_, err = qtx.GetRegisteredNodeByEthAddress(ctx, vrOwnerWallet)
	if err == nil {
		// Allow duplicate registration transactions
		core.logger.Infof("Node '%s' already registered", vrCometAddress)
	} else if !errors.Is(err, pgx.ErrNoRows) {
		return fmt.Errorf("failed to check db for registration status: %v", err)
	}

	return nil
}

// persists the register node request should it pass validation
func (core *CoreApplication) finalizeRegisterNode(ctx context.Context, tx *gen_proto.SignedTransaction) (*gen_proto.ValidatorRegistration, error) {
	if err := core.isValidRegisterNodeTx(ctx, tx); err != nil {
		return nil, fmt.Errorf("invalid register node tx: %v", err)
	}

	qtx := core.getDb()

	vr := tx.GetValidatorRegistration()
	sig := tx.GetSignature()
	txBytes, err := proto.Marshal(vr)
	if err != nil {
		return nil, fmt.Errorf("could not unmarshal tx bytes: %v", err)
	}

	pubKey, address, err := accounts.EthRecover(sig, txBytes)
	if err != nil {
		return nil, fmt.Errorf("could not recover signer: %v", err)
	}

	serializedPubKey, err := accounts.SerializePublicKey(pubKey)
	if err != nil {
		return nil, fmt.Errorf("could not serialize pubkey: %v", err)
	}

	registerNode := tx.GetValidatorRegistration()

	if _, err = qtx.GetRegisteredNodeByEthAddress(ctx, address); err != nil {
		// Do not reinsert duplicate registrations
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
	}

	return vr, nil
}
