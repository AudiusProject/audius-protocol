package registry_bridge

import (
	"context"
	"errors"
	"fmt"
	"math/big"
	"time"

	"github.com/AudiusProject/audius-protocol/pkg/core/accounts"
	"github.com/AudiusProject/audius-protocol/pkg/core/contracts"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/jackc/pgx/v5"
)

// checks mainnet eth for itself, if registered and not
// already in the comet state will register itself on comet
func (r *Registry) RegisterSelf() error {
	ctx := context.Background()

	if r.isSelfAlreadyRegistered(ctx) {
		return nil
	}

	logger := r.logger

	web3 := r.contracts

	privKey := r.config.EthereumKey
	nodeAddress := crypto.PubkeyToAddress(privKey.PublicKey)
	nodeEndpoint := r.config.NodeEndpoint

	spf, err := web3.GetServiceProviderFactoryContract()
	if err != nil {
		return fmt.Errorf("could not get service provider factory: %v", err)
	}

	spID, err := spf.GetServiceProviderIdFromEndpoint(nil, nodeEndpoint)
	if err != nil {
		return fmt.Errorf("issue getting sp data: %v", err)
	}

	// contract returns 0 if endpoint not registered
	if spID.Uint64() == 0 {
		logger.Infof("node %s : %s not registered on mainnet", nodeAddress.Hex(), nodeEndpoint)
		if r.config.Environment == "dev" || r.config.Environment == "sandbox" {
			if err := r.registerSelfOnEth(); err != nil {
				return fmt.Errorf("error registering onto eth: %v", err)
			}
			// call again but registered this time
			return r.RegisterSelf()
		}
		logger.Info("continuing unregistered")
		return nil
	}

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
	privKey, err := accounts.EthToEthKey(r.config.DelegatePrivateKey)
	if err != nil {
		return fmt.Errorf("could not get eth key: %v", err)
	}
	delegateOwnerWallet := crypto.PubkeyToAddress(privKey.PublicKey)

	_, err = spf.Register(opts, serviceType, endpoint, stake, delegateOwnerWallet)
	if err != nil {
		return fmt.Errorf("couldn't register node: %v", err)
	}

	r.logger.Infof("node %s registered on eth", endpoint)

	return nil
}
