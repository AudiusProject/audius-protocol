package registry_bridge

import (
	"context"
	"errors"
	"fmt"
	"math/big"
	"time"

	"github.com/AudiusProject/audius-protocol/pkg/core/accounts"
	"github.com/AudiusProject/audius-protocol/pkg/core/common"
	"github.com/AudiusProject/audius-protocol/pkg/core/contracts"
	"github.com/AudiusProject/audius-protocol/pkg/core/gen/core_proto"
	"github.com/AudiusProject/audius-protocol/pkg/logger"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"google.golang.org/protobuf/proto"
)

// checks mainnet eth for itself, if registered and not
// already in the comet state will register itself on comet
func (r *Registry) RegisterSelf() error {
	ctx := context.Background()

	if r.isSelfAlreadyRegistered(ctx) {
		r.logger.Info("Skipping registration, we are already registered.")
		return nil
	}

	nodeAddress := crypto.PubkeyToAddress(r.config.EthereumKey.PublicKey)
	nodeEndpoint := r.config.NodeEndpoint

	isRegistered, err := r.isSelfRegisteredOnEth()
	if err != nil {
		return fmt.Errorf("could not check ethereum registration status: %v", err)
	}
	if !isRegistered {
		r.logger.Infof("node %s : %s not registered on Ethereum", nodeAddress.Hex(), nodeEndpoint)
		if r.isDevEnvironment() {
			if err := r.registerSelfOnEth(); err != nil {
				return fmt.Errorf("error registering onto eth: %v", err)
			}
		} else {
			logger.Info("continuing unregistered")
			return nil
		}
	}

	spf, err := r.contracts.GetServiceProviderFactoryContract()
	if err != nil {
		return fmt.Errorf("could not get service provider factory: %v", err)
	}

	spID, err := spf.GetServiceProviderIdFromEndpoint(nil, nodeEndpoint)
	if err != nil {
		return fmt.Errorf("issue getting sp data: %v", err)
	}

	serviceType, err := contracts.ServiceType(r.config.NodeType)
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

	nodeRecord, err := r.queries.GetNodeByEndpoint(ctx, nodeEndpoint)
	if errors.Is(err, pgx.ErrNoRows) {
		r.logger.Infof("node %s not found on comet but found on eth, registering", nodeEndpoint)
		if err := r.registerSelfOnComet(ethBlock, spID.String()); err != nil {
			return fmt.Errorf("could not register on comet: %v", err)
		}
		return nil
	} else if err != nil {
		return err
	}

	r.logger.Infof("node %s : %s registered on network %s", nodeRecord.EthAddress, nodeRecord.Endpoint, r.config.Environment)
	return nil
}

func (r *Registry) isDevEnvironment() bool {
	return r.config.Environment == "dev" || r.config.Environment == "sandbox"
}

func (r *Registry) registerSelfOnComet(ethBlock, spID string) error {
	serviceType, err := contracts.ServiceType(r.config.NodeType)
	if err != nil {
		return fmt.Errorf("invalid node type: %v", err)
	}

	registrationTx := &core_proto.ValidatorRegistration{
		Endpoint:     r.config.NodeEndpoint,
		CometAddress: r.config.ProposerAddress,
		EthBlock:     ethBlock,
		NodeType:     common.HexToUtf8(serviceType),
		SpId:         spID,
	}

	eventBytes, err := proto.Marshal(registrationTx)
	if err != nil {
		return fmt.Errorf("failure to marshal register event: %v", err)
	}

	sig, err := accounts.EthSign(r.config.EthereumKey, eventBytes)
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

	txhash, err := r.grpcServer.SendTransaction(context.Background(), req)
	if err != nil {
		return fmt.Errorf("send register tx failed: %v", err)
	}

	r.logger.Infof("registered node %s in tx %s", r.config.NodeEndpoint, txhash)

	return nil
}

func (r *Registry) awaitNodeCatchup(ctx context.Context) error {
	retries := 60
	for tries := retries; tries >= 0; tries-- {
		res, err := r.rpc.Status(ctx)
		if err != nil {
			r.logger.Errorf("error getting comet health: %v", err)
			time.Sleep(10 * time.Second)
			continue
		}

		if res.SyncInfo.CatchingUp {
			r.logger.Infof("comet catching up: latest seen block %d", res.SyncInfo.LatestBlockHeight)
			time.Sleep(10 * time.Second)
			continue
		}

		// no health error nor catching up
		return nil
	}
	return errors.New("timeout waiting for comet to catch up")
}

func (r *Registry) isSelfAlreadyRegistered(ctx context.Context) bool {
	res, err := r.queries.GetNodeByEndpoint(ctx, r.config.NodeEndpoint)

	if errors.Is(err, pgx.ErrNoRows) {
		return false
	}

	if err != nil {
		r.logger.Errorf("error getting registered nodes: %v", err)
		return false
	}

	// return if owner wallets match
	return res.EthAddress == r.config.WalletAddress
}

func (r *Registry) isSelfRegisteredOnEth() (bool, error) {
	spf, err := r.contracts.GetServiceProviderFactoryContract()
	if err != nil {
		return false, fmt.Errorf("could not get service provider factory: %v", err)
	}

	spID, err := spf.GetServiceProviderIdFromEndpoint(nil, r.config.NodeEndpoint)
	if err != nil {
		return false, fmt.Errorf("issue getting sp data: %v", err)
	}

	// contract returns 0 if endpoint not registered
	return spID.Uint64() != 0, nil
}

func (r *Registry) registerSelfOnEth() error {
	chainID, err := r.contracts.Rpc.ChainID(context.Background())
	if err != nil {
		return fmt.Errorf("could not get chain id: %v", err)
	}

	opts, err := bind.NewKeyedTransactorWithChainID(r.config.EthereumKey, chainID)
	if err != nil {
		return fmt.Errorf("could not create keyed transactor: %v", err)
	}

	token, err := r.contracts.GetAudioTokenContract()
	if err != nil {
		return fmt.Errorf("could not get token contract: %v", err)
	}

	spf, err := r.contracts.GetServiceProviderFactoryContract()
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

	serviceType, err := contracts.ServiceType(r.config.NodeType)
	if err != nil {
		return fmt.Errorf("invalid node type: %v", err)
	}

	endpoint := r.config.NodeEndpoint
	delegateOwnerWallet := crypto.PubkeyToAddress(r.config.EthereumKey.PublicKey)

	_, err = spf.Register(opts, serviceType, endpoint, stake, delegateOwnerWallet)
	if err != nil {
		return fmt.Errorf("couldn't register node: %v", err)
	}

	r.logger.Infof("node %s registered on eth", endpoint)

	return nil
}
