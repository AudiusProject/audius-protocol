//go:generate sh -c "chmod +x ./generate_contract.sh && ./generate_contract.sh"
package contracts

import (
	"context"
	"errors"
	"fmt"
	"math/big"
	"sync"

	"github.com/AudiusProject/audius-protocol/pkg/core/common"
	"github.com/AudiusProject/audius-protocol/pkg/core/contracts/gen"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	geth "github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"golang.org/x/sync/errgroup"
)

// valid service types
var (
	DiscoveryNode = common.Utf8ToHex("discovery-node")
	ContentNode   = common.Utf8ToHex("content-node")
)

// contract keys
var (
	RegistryKey               = common.Utf8ToHex("Registry")
	GovernanceKey             = common.Utf8ToHex("Governance")
	StakingKey                = common.Utf8ToHex("StakingProxy")
	ServiceProviderFactoryKey = common.Utf8ToHex("ServiceProviderFactory")
	ClaimsManagerKey          = common.Utf8ToHex("ClaimsManagerProxy")
	DelegateManagerKey        = common.Utf8ToHex("DelegateManager")
	AudiusTokenKey            = common.Utf8ToHex("Token")
	RewardsManagerKey         = common.Utf8ToHex("EthRewardsManagerProxy")
)

// manager struct so contracts get loaded lazily upon usage
// and don't spam rpcs for contracts a developer may not need
type AudiusContracts struct {
	Rpc *ethclient.Client

	/** contract addresses */
	RegistryAddress               *geth.Address
	GovernanceAddress             *geth.Address
	StakingAddress                *geth.Address
	ServiceProviderFactoryAddress *geth.Address
	ClaimsManagerAddress          *geth.Address
	DelegateManagerAddress        *geth.Address
	AudioTokenAddress             *geth.Address
	RewardsManagerAddress         *geth.Address
	ServiceTypeManagerAddress     *geth.Address

	/** contract instances */
	Registry               *gen.Registry
	Governance             *gen.Governance
	Staking                *gen.Staking
	ServiceProviderFactory *gen.ServiceProviderFactory
	ClaimsManager          *gen.ClaimsManager
	DelegateManager        *gen.DelegateManager
	AudioToken             *gen.AudiusToken
	RewardsManager         *gen.EthRewardsManager
	ServiceTypeManager     *gen.ServiceTypeManager
}

// instantiates audius contract manager so that contracts can be initialized lazily
func NewAudiusContracts(rpc *ethclient.Client, registryAddress string) (*AudiusContracts, error) {
	ok := geth.IsHexAddress(registryAddress)
	if !ok {
		return nil, fmt.Errorf("registryAddress %s is not a valid hex address", registryAddress)
	}
	addr := geth.HexToAddress(registryAddress)
	registry, err := gen.NewRegistry(addr, rpc)
	if err != nil {
		return nil, err
	}

	// ensure we can call the registry
	_, err = registry.Owner(nil)
	if err != nil {
		return nil, fmt.Errorf("could not get registry owner: %v", err)
	}

	return &AudiusContracts{
		Rpc:      rpc,
		Registry: registry,
	}, nil
}

// instantiates audius contract manager and eagerly gathers contract instances as well
func NewAudiusContractsInit(rpc *ethclient.Client, registryAddress string) (*AudiusContracts, error) {
	ac, err := NewAudiusContracts(rpc, registryAddress)
	if err != nil {
		return nil, err
	}

	// init all contracts
	_, err = ac.GetAudioTokenContract()
	if err != nil {
		return nil, errors.Join(errors.New("init audio contract failed"), err)
	}
	_, err = ac.GetGovernanceContract()
	if err != nil {
		return nil, errors.Join(errors.New("init governance contract failed"), err)
	}
	_, err = ac.GetStakingContract()
	if err != nil {
		return nil, errors.Join(errors.New("init staking contract failed"), err)
	}
	_, err = ac.GetServiceProviderFactoryContract()
	if err != nil {
		return nil, errors.Join(errors.New("init service provider factory contract failed"), err)
	}
	_, err = ac.GetClaimsManagerContract()
	if err != nil {
		return nil, errors.Join(errors.New("init claims manager contract failed"), err)
	}
	_, err = ac.GetDelegateManagerContract()
	if err != nil {
		return nil, errors.Join(errors.New("init delegate manager contract failed"), err)
	}
	_, err = ac.GetRewardsManagerContract()
	if err != nil {
		return nil, errors.Join(errors.New("init rewards manager contract failed"), err)
	}
	_, err = ac.GetServiceTypeManagerContract()
	if err != nil {
		return nil, errors.Join(errors.New("init service type manager contract failed"), err)
	}

	return ac, nil
}

func (ac *AudiusContracts) GetAudioTokenContract() (*gen.AudiusToken, error) {
	if ac.AudioToken != nil {
		return ac.AudioToken, nil
	}

	addr, err := ac.Registry.GetContract0(nil, AudiusTokenKey)
	if err != nil {
		return nil, err
	}
	ac.AudioTokenAddress = &addr

	contract, err := gen.NewAudiusToken(addr, ac.Rpc)
	if err != nil {
		return nil, err
	}

	ac.AudioToken = contract
	return contract, nil
}

func (ac *AudiusContracts) GetGovernanceContract() (*gen.Governance, error) {
	if ac.Governance != nil {
		return ac.Governance, nil
	}

	addr, err := ac.Registry.GetContract0(nil, GovernanceKey)
	if err != nil {
		return nil, err
	}
	ac.GovernanceAddress = &addr

	contract, err := gen.NewGovernance(addr, ac.Rpc)
	if err != nil {
		return nil, err
	}

	ac.Governance = contract
	return contract, nil
}

func (ac *AudiusContracts) GetStakingContract() (*gen.Staking, error) {
	if ac.Staking != nil {
		return ac.Staking, nil
	}

	addr, err := ac.Registry.GetContract0(nil, StakingKey)
	if err != nil {
		return nil, err
	}
	ac.StakingAddress = &addr

	contract, err := gen.NewStaking(addr, ac.Rpc)
	if err != nil {
		return nil, err
	}

	ac.Staking = contract
	return contract, nil
}

func (ac *AudiusContracts) GetServiceProviderFactoryContract() (*gen.ServiceProviderFactory, error) {
	if ac.ServiceProviderFactory != nil {
		return ac.ServiceProviderFactory, nil
	}

	addr, err := ac.Registry.GetContract0(nil, ServiceProviderFactoryKey)
	if err != nil {
		return nil, err
	}
	ac.ServiceProviderFactoryAddress = &addr

	contract, err := gen.NewServiceProviderFactory(addr, ac.Rpc)
	if err != nil {
		return nil, err
	}

	ac.ServiceProviderFactory = contract
	return contract, nil
}

func (ac *AudiusContracts) GetClaimsManagerContract() (*gen.ClaimsManager, error) {
	if ac.ClaimsManager != nil {
		return ac.ClaimsManager, nil
	}

	addr, err := ac.Registry.GetContract0(nil, ClaimsManagerKey)
	if err != nil {
		return nil, err
	}
	ac.ClaimsManagerAddress = &addr

	contract, err := gen.NewClaimsManager(addr, ac.Rpc)
	if err != nil {
		return nil, err
	}

	ac.ClaimsManager = contract
	return contract, nil
}

func (ac *AudiusContracts) GetDelegateManagerContract() (*gen.DelegateManager, error) {
	if ac.DelegateManager != nil {
		return ac.DelegateManager, nil
	}

	addr, err := ac.Registry.GetContract0(nil, DelegateManagerKey)
	if err != nil {
		return nil, err
	}
	ac.DelegateManagerAddress = &addr

	contract, err := gen.NewDelegateManager(addr, ac.Rpc)
	if err != nil {
		return nil, err
	}

	ac.DelegateManager = contract
	return contract, nil
}

func (ac *AudiusContracts) GetRewardsManagerContract() (*gen.EthRewardsManager, error) {
	if ac.RewardsManager != nil {
		return ac.RewardsManager, nil
	}

	addr, err := ac.Registry.GetContract0(nil, RewardsManagerKey)
	if err != nil {
		return nil, err
	}
	ac.RewardsManagerAddress = &addr

	contract, err := gen.NewEthRewardsManager(addr, ac.Rpc)
	if err != nil {
		return nil, err
	}

	ac.RewardsManager = contract
	return contract, nil
}

func (ac *AudiusContracts) GetServiceTypeManagerContract() (*gen.ServiceTypeManager, error) {
	if ac.ServiceTypeManager != nil {
		return ac.ServiceTypeManager, nil
	}

	spf, err := ac.GetServiceProviderFactoryContract()
	if err != nil {
		return nil, err
	}

	addr, err := spf.GetServiceTypeManagerAddress(nil)
	if err != nil {
		return nil, err
	}
	ac.ServiceTypeManagerAddress = &addr

	contract, err := gen.NewServiceTypeManager(addr, ac.Rpc)
	if err != nil {
		return nil, err
	}

	ac.ServiceTypeManager = contract
	return contract, nil
}

/* Utilities */

type Node struct {
	Owner               geth.Address
	Endpoint            string
	BlockNumber         *big.Int
	DelegateOwnerWallet geth.Address
}

func (ac *AudiusContracts) GetAllRegisteredNodes(ctx context.Context) ([]*Node, error) {
	nodes := []*Node{}

	g, ctx := errgroup.WithContext(ctx)

	g.Go(func() error {
		discoveryNodes, err := ac.GetAllRegisteredNodesForType(ctx, DiscoveryNode)
		if err != nil {
			return err
		}
		nodes = append(nodes, discoveryNodes...)
		return nil
	})

	g.Go(func() error {
		contentNodes, err := ac.GetAllRegisteredNodesForType(ctx, ContentNode)
		if err != nil {
			return err
		}
		nodes = append(nodes, contentNodes...)
		return nil
	})

	if err := g.Wait(); err != nil {
		return nodes, err
	}

	return nodes, nil
}

func (ac *AudiusContracts) GetAllRegisteredNodesForType(ctx context.Context, nodeType [32]byte) ([]*Node, error) {
	nodes := []*Node{}
	spf, err := ac.GetServiceProviderFactoryContract()
	if err != nil {
		return nodes, err
	}

	ids, err := spf.GetTotalServiceTypeProviders(&bind.CallOpts{
		Context: ctx,
	}, nodeType)
	if err != nil {
		return nodes, err
	}

	var mu sync.Mutex
	one := big.NewInt(1)
	g, ctx := errgroup.WithContext(ctx)

	for id := big.NewInt(1); id.Cmp(ids) <= 0; id.Add(id, one) {
		// Create a copy of the current ID to avoid data races
		currentID := new(big.Int).Set(id)

		g.Go(func() error {
			info, err := spf.GetServiceEndpointInfo(&bind.CallOpts{
				Context: ctx,
			}, nodeType, currentID)
			if err != nil {
				return err
			}

			// zero address
			if info.DelegateOwnerWallet == (geth.Address{}) {
				return nil
			}

			// Safely append the result to the nodes slice
			mu.Lock()
			defer mu.Unlock()
			nodes = append(nodes, &Node{
				Owner:               info.Owner,
				DelegateOwnerWallet: info.DelegateOwnerWallet,
				BlockNumber:         info.BlockNumber,
				Endpoint:            info.Endpoint,
			})
			return nil
		})
	}

	// Wait for all goroutines to complete
	if err := g.Wait(); err != nil {
		return nodes, err
	}

	return nodes, nil
}
