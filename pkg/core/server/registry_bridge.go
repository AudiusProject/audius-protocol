// Keeps the validators updated in cometbft and core up to date with what is present on the ethereum node registry.
package server

import (
	"context"
	"errors"
	"fmt"
	"math/big"
	"time"

	"github.com/AudiusProject/audius-protocol/pkg/core/common"
	"github.com/AudiusProject/audius-protocol/pkg/core/contracts"
	"github.com/AudiusProject/audius-protocol/pkg/core/db"
	"github.com/AudiusProject/audius-protocol/pkg/core/gen/core_proto"
	"github.com/AudiusProject/audius-protocol/pkg/logger"
	"github.com/cometbft/cometbft/crypto/ed25519"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"google.golang.org/protobuf/proto"
)

func (s *Server) startRegistryBridge() error {
	<-s.awaitRpcReady
	s.logger.Info("starting registry bridge")

	// check eth status
	_, err := s.eth.ChainID(context.Background())
	if err != nil {
		return fmt.Errorf("init registry bridge failed eth chain id: %v", err)
	}

	// check comet status
	_, err = s.rpc.Status(context.Background())
	if err != nil {
		return fmt.Errorf("init registry bridge failed comet rpc status: %v", err)
	}

	if err := s.awaitNodeCatchup(context.Background()); err != nil {
		return err
	}

	retries := 60
	delay := 10 * time.Second

	ticker := time.NewTicker(delay)
	defer ticker.Stop()

	for range ticker.C {
		if retries == 0 {
			s.logger.Warn("exhausted registration retries")
			return nil
		}

		if err := s.RegisterSelf(); err != nil {
			s.logger.Errorf("node registration failed, will try again: %v", err)
			retries--
		} else {
			return nil
		}
	}
	return nil
}

// checks mainnet eth for itself, if registered and not
// already in the comet state will register itself on comet
func (s *Server) RegisterSelf() error {
	ctx := context.Background()

	if s.isSelfAlreadyRegistered(ctx) {
		s.logger.Info("Skipping registration, we are already registered.")
		return nil
	}

	nodeAddress := crypto.PubkeyToAddress(s.config.EthereumKey.PublicKey)
	nodeEndpoint := s.config.NodeEndpoint

	isRegistered, err := s.isSelfRegisteredOnEth()
	if err != nil {
		return fmt.Errorf("could not check ethereum registration status: %v", err)
	}
	if !isRegistered {
		s.logger.Infof("node %s : %s not registered on Ethereum", nodeAddress.Hex(), nodeEndpoint)
		if s.isDevEnvironment() {
			if err := s.registerSelfOnEth(); err != nil {
				return fmt.Errorf("error registering onto eth: %v", err)
			}
		} else {
			logger.Info("continuing unregistered")
			return nil
		}
	}

	spf, err := s.contracts.GetServiceProviderFactoryContract()
	if err != nil {
		return fmt.Errorf("could not get service provider factory: %v", err)
	}

	spID, err := spf.GetServiceProviderIdFromEndpoint(nil, nodeEndpoint)
	if err != nil {
		return fmt.Errorf("issue getting sp data: %v", err)
	}

	serviceType, err := contracts.ServiceType(s.config.NodeType)
	if err != nil {
		return fmt.Errorf("invalid node type: %v", err)
	}

	info, err := spf.GetServiceEndpointInfo(nil, serviceType, spID)
	if err != nil {
		return fmt.Errorf("could not get service endpoint info: %v", err)
	}

	if info.DelegateOwnerWallet != nodeAddress {
		return fmt.Errorf("node %s is claiming to be %s but that endpoint is owned by %s", nodeAddress.Hex(), nodeEndpoint, info.DelegateOwnerWallet.Hex())
	}

	ethBlock := info.BlockNumber.String()

	nodeRecord, err := s.db.GetNodeByEndpoint(ctx, nodeEndpoint)
	if errors.Is(err, pgx.ErrNoRows) {
		s.logger.Infof("node %s not found on comet but found on eth, registering", nodeEndpoint)
		if err := s.registerSelfOnComet(ethBlock, spID.String()); err != nil {
			return fmt.Errorf("could not register on comet: %v", err)
		}
		return nil
	} else if err != nil {
		return err
	}

	s.logger.Infof("node %s : %s registered on network %s", nodeRecord.EthAddress, nodeRecord.Endpoint, s.config.Environment)
	return nil
}

func (s *Server) isDevEnvironment() bool {
	return s.config.Environment == "dev" || s.config.Environment == "sandbox"
}

func (s *Server) registerSelfOnComet(ethBlock, spID string) error {
	genValidators := s.config.GenesisFile.Validators
	isGenValidator := false
	for _, validator := range genValidators {
		if validator.Address.String() == s.config.ProposerAddress {
			isGenValidator = true
			break
		}
	}

	peers := s.GetPeers()
	noPeers := len(peers) == 0

	if !isGenValidator && noPeers {
		return fmt.Errorf("not in genesis and no peers, retrying to register on comet later")
	}

	serviceType, err := contracts.ServiceType(s.config.NodeType)
	if err != nil {
		return fmt.Errorf("invalid node type: %v", err)
	}

	registrationTx := &core_proto.ValidatorRegistration{
		Endpoint:     s.config.NodeEndpoint,
		CometAddress: s.config.ProposerAddress,
		EthBlock:     ethBlock,
		NodeType:     common.HexToUtf8(serviceType),
		SpId:         spID,
		PubKey:       s.config.CometKey.PubKey().Bytes(),
		Power:        int64(s.config.ValidatorVotingPower),
	}

	eventBytes, err := proto.Marshal(registrationTx)
	if err != nil {
		return fmt.Errorf("failure to marshal register event: %v", err)
	}

	sig, err := common.EthSign(s.config.EthereumKey, eventBytes)
	if err != nil {
		return fmt.Errorf("could not sign register event: %v", err)
	}

	tx := &core_proto.SignedTransaction{
		Signature: sig,
		RequestId: uuid.NewString(),
		Transaction: &core_proto.SignedTransaction_ValidatorRegistration{
			ValidatorRegistration: registrationTx,
		},
	}

	req := &core_proto.SendTransactionRequest{
		Transaction: tx,
	}

	txhash, err := s.SendTransaction(context.Background(), req)
	if err != nil {
		return fmt.Errorf("send register tx failed: %v", err)
	}

	s.logger.Infof("registered node %s in tx %s", s.config.NodeEndpoint, txhash)

	return nil
}

func (s *Server) awaitNodeCatchup(ctx context.Context) error {
	retries := 60
	for tries := retries; tries >= 0; tries-- {
		res, err := s.rpc.Status(ctx)
		if err != nil {
			s.logger.Errorf("error getting comet health: %v", err)
			time.Sleep(10 * time.Second)
			continue
		}

		if res.SyncInfo.CatchingUp {
			s.logger.Infof("comet catching up: latest seen block %d", res.SyncInfo.LatestBlockHeight)
			time.Sleep(10 * time.Second)
			continue
		}

		// no health error nor catching up
		return nil
	}
	return errors.New("timeout waiting for comet to catch up")
}

func (s *Server) isSelfAlreadyRegistered(ctx context.Context) bool {
	res, err := s.db.GetNodeByEndpoint(ctx, s.config.NodeEndpoint)

	if errors.Is(err, pgx.ErrNoRows) {
		return false
	}

	if err != nil {
		s.logger.Errorf("error getting registered nodes: %v", err)
		return false
	}

	// return if owner wallets match
	return res.EthAddress == s.config.WalletAddress
}

func (s *Server) isSelfRegisteredOnEth() (bool, error) {
	spf, err := s.contracts.GetServiceProviderFactoryContract()
	if err != nil {
		return false, fmt.Errorf("could not get service provider factory: %v", err)
	}

	spID, err := spf.GetServiceProviderIdFromEndpoint(nil, s.config.NodeEndpoint)
	if err != nil {
		return false, fmt.Errorf("issue getting sp data: %v", err)
	}

	// contract returns 0 if endpoint not registered
	return spID.Uint64() != 0, nil
}

func (s *Server) registerSelfOnEth() error {
	chainID, err := s.contracts.Rpc.ChainID(context.Background())
	if err != nil {
		return fmt.Errorf("could not get chain id: %v", err)
	}

	opts, err := bind.NewKeyedTransactorWithChainID(s.config.EthereumKey, chainID)
	if err != nil {
		return fmt.Errorf("could not create keyed transactor: %v", err)
	}

	token, err := s.contracts.GetAudioTokenContract()
	if err != nil {
		return fmt.Errorf("could not get token contract: %v", err)
	}

	spf, err := s.contracts.GetServiceProviderFactoryContract()
	if err != nil {
		return fmt.Errorf("could not get service provider factory contract: %v", err)
	}

	stakingAddress, err := spf.GetStakingAddress(nil)
	if err != nil {
		return fmt.Errorf("could not get staking address: %v", err)
	}

	decimals := 18
	stake := new(big.Int).Mul(big.NewInt(200000), new(big.Int).Exp(big.NewInt(10), big.NewInt(int64(decimals)), nil))

	_, err = token.Approve(opts, stakingAddress, stake)
	if err != nil {
		return fmt.Errorf("could not approve tokens: %v", err)
	}

	serviceType, err := contracts.ServiceType(s.config.NodeType)
	if err != nil {
		return fmt.Errorf("invalid node type: %v", err)
	}

	endpoint := s.config.NodeEndpoint
	delegateOwnerWallet := crypto.PubkeyToAddress(s.config.EthereumKey.PublicKey)

	_, err = spf.Register(opts, serviceType, endpoint, stake, delegateOwnerWallet)
	if err != nil {
		return fmt.Errorf("couldn't register node: %v", err)
	}

	s.logger.Infof("node %s registered on eth", endpoint)

	return nil
}

func (s *Server) validateValidatorRegistration(tx *core_proto.SignedTransaction_ValidatorRegistration) error {
	db := s.db

	cometAddr := tx.ValidatorRegistration.CometAddress

	node, err := db.GetRegisteredNodeByCometAddress(context.Background(), cometAddr)
	if err != nil {
		if !errors.Is(err, pgx.ErrNoRows) {
			return nil
		}
		return fmt.Errorf("validation db fail: %v", err)
	}

	jailed := node.Jailed
	if jailed.Bool {
		return fmt.Errorf("node %s is jailed and can't be re-registered", cometAddr)
	}

	return nil
}

// checks if the register node tx is valid
// calls ethereum mainnet and validates signature to confirm node should be a validator
func (s *Server) isValidRegisterNodeTx(_ctx context.Context, tx *core_proto.SignedTransaction) error {
	sig := tx.GetSignature()
	if sig == "" {
		return fmt.Errorf("no signature provided for registration tx: %v", tx)
	}

	vr := tx.GetValidatorRegistration()
	if vr == nil {
		return fmt.Errorf("unknown tx fell into isValidRegisterNodeTx: %v", tx)
	}

	spf, err := s.contracts.GetServiceProviderFactoryContract()
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
		return fmt.Errorf("could not marshal registration tx: %v", err)
	}

	_, address, err := common.EthRecover(tx.GetSignature(), data)
	if err != nil {
		return fmt.Errorf("could not recover msg sig: %v", err)
	}

	vrOwnerWallet := address
	vrEndpoint := vr.GetEndpoint()
	vrEthBlock := vr.GetEthBlock()
	vrCometAddress := vr.GetCometAddress()
	vrPower := int(vr.GetPower())

	if len(vr.GetPubKey()) == 0 {
		return fmt.Errorf("Public Key missing from %s registration tx", vrEndpoint)
	}
	vrPubKey := ed25519.PubKey(vr.GetPubKey())

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

	if vrPower != s.config.ValidatorVotingPower {
		return fmt.Errorf("Invalid voting power '%d'", vrPower)
	}

	return nil
}

// persists the register node request should it pass validation
func (s *Server) finalizeRegisterNode(ctx context.Context, tx *core_proto.SignedTransaction) (*core_proto.ValidatorRegistration, error) {
	if err := s.isValidRegisterNodeTx(ctx, tx); err != nil {
		return nil, fmt.Errorf("invalid register node tx: %v", err)
	}

	qtx := s.getDb()

	vr := tx.GetValidatorRegistration()
	sig := tx.GetSignature()
	txBytes, err := proto.Marshal(vr)
	if err != nil {
		return nil, fmt.Errorf("could not unmarshal tx bytes: %v", err)
	}

	pubKey, address, err := common.EthRecover(sig, txBytes)
	if err != nil {
		return nil, fmt.Errorf("could not recover signer: %v", err)
	}

	serializedPubKey, err := common.SerializePublicKey(pubKey)
	if err != nil {
		return nil, fmt.Errorf("could not serialize pubkey: %v", err)
	}

	registerNode := tx.GetValidatorRegistration()

	// Do not reinsert duplicate registrations
	if _, err = qtx.GetRegisteredNodeByEthAddress(ctx, address); errors.Is(err, pgx.ErrNoRows) {
		err = qtx.InsertRegisteredNode(ctx, db.InsertRegisteredNodeParams{
			PubKey:       serializedPubKey,
			EthAddress:   address,
			Endpoint:     registerNode.GetEndpoint(),
			CometAddress: registerNode.GetCometAddress(),
			EthBlock:     registerNode.GetEthBlock(),
			NodeType:     registerNode.GetNodeType(),
			SpID:         registerNode.GetSpId(),
		})
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("error inserting registered node: %v", err)
		}
	}

	return vr, nil
}
