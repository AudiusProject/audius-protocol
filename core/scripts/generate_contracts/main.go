package main

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
)

type abifile struct {
	path       string
	outputName string
	typeName   string
}

func main() {
	protocolDir := os.Getenv("PROTOCOL_DIR")
	if protocolDir == "" {
		log.Fatal("PROTOCOL_DIR environment variable is not set")
	}

	contracts := []abifile{
		{
			path:       "packages/libs/src/data-contracts/ABIs/EntityManager.json",
			outputName: "entity_manager",
			typeName:   "EntityManager",
		},
		{
			path:       "packages/libs/src/eth-contracts/ABIs/Registry.json",
			outputName: "registry",
			typeName:   "Registry",
		},
		{
			path:       "packages/libs/src/eth-contracts/ABIs/Governance.json",
			outputName: "governance",
			typeName:   "Governance",
		},
		{
			path:       "packages/libs/src/eth-contracts/ABIs/Staking.json",
			outputName: "staking",
			typeName:   "Staking",
		},
		{
			path:       "packages/libs/src/eth-contracts/ABIs/ServiceProviderFactory.json",
			outputName: "service_provider_factory",
			typeName:   "ServiceProviderFactory",
		},
		{
			path:       "packages/libs/src/eth-contracts/ABIs/ServiceTypeManager.json",
			outputName: "service_type_manager",
			typeName:   "ServiceTypeManager",
		},
		{
			path:       "packages/libs/src/eth-contracts/ABIs/ClaimsManager.json",
			outputName: "claims_manager",
			typeName:   "ClaimsManager",
		},
		{
			path:       "packages/libs/src/eth-contracts/ABIs/DelegateManagerV2.json",
			outputName: "delegate_manager",
			typeName:   "DelegateManagerV2",
		},
		{
			path:       "packages/libs/src/eth-contracts/ABIs/AudiusToken.json",
			outputName: "audius_token",
			typeName:   "AudiusToken",
		},
		{
			path:       "packages/libs/src/eth-contracts/ABIs/EthRewardsManager.json",
			outputName: "eth_rewards_manager",
			typeName:   "EthRewardsManager",
		},
	}

	for _, contract := range contracts {
		abiPath := filepath.Join(protocolDir, contract.path)
		outputPath := fmt.Sprintf("%s/core/contracts/gen/%s.go", protocolDir, contract.outputName)

		cmd := exec.Command("bash", "-c",
			"abigen --abi <(jq -c .abi "+abiPath+") --pkg gen --type "+contract.typeName+" --out "+outputPath)

		cmd.Env = append(os.Environ(), "SHELL=/bin/bash")
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr

		err := cmd.Run()
		if err != nil {
			log.Fatalf("abigen command failed: %v", err)
		}
	}
}
