//go:generate go run ../scripts/generate_contracts/main.go
//go:generate go run ../scripts/generate_options/main.go ContractsConfig contract_config_options.go

package contracts

import (
	"github.com/AudiusProject/audius-protocol/core/contracts/gen"
	"github.com/ethereum/go-ethereum/ethclient"
)

type ContractsConfig struct {
	AcdcEndpoint string
	EthEndpoint  string

	RegistryAddress               string
	GovernanceAddress             string
	StakingAddress                string
	ServiceProviderFactoryAddress string
	ServiceTypeManagerAddress     string
	ClaimsManagerAddress          string
	DelegateManagerAddress        string
	AudioTokenAddress             string
	RewardsManagerAddress         string
}

func defaultContractsConfig() *ContractsConfig {
	return &ContractsConfig{}
}

func initContractsConfig(*ContractsConfig) error {
	return nil
}

type Contracts struct {
	AcdcRPC *ethclient.Client
	EthRPC  *ethclient.Client

	EntityManager          *gen.EntityManager
	Registry               *gen.Registry
	Governance             *gen.Governance
	Staking                *gen.Staking
	ServiceProviderFactory *gen.ServiceProviderFactory
	ClaimsManager          *gen.ClaimsManager
	DelegateManager        *gen.DelegateManagerV2
	AudioToken             *gen.AudiusToken
	RewardsManager         *gen.EthRewardsManager
	ServiceTypeManager     *gen.ServiceTypeManager
}
