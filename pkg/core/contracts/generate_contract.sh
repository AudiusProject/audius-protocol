#!/bin/bash

# entity manager code generation
abigen --abi <(curl -s https://raw.githubusercontent.com/AudiusProject/audius-protocol/main/packages/libs/src/data-contracts/ABIs/EntityManager.json | jq '.abi') --pkg gen --type EntityManager --out ./gen/entity_manager.go

# eth contract code generation
abigen --abi <(curl -s https://raw.githubusercontent.com/AudiusProject/audius-protocol/main/packages/libs/src/eth-contracts/ABIs/Registry.json | jq '.abi') --pkg gen --type Registry --out ./gen/registry.go

abigen --abi <(curl -s https://raw.githubusercontent.com/AudiusProject/audius-protocol/main/packages/libs/src/eth-contracts/ABIs/Governance.json | jq '.abi') --pkg gen --type Governance --out ./gen/governance.go

abigen --abi <(curl -s https://raw.githubusercontent.com/AudiusProject/audius-protocol/main/packages/libs/src/eth-contracts/ABIs/Staking.json | jq '.abi') --pkg gen --type Staking --out ./gen/staking.go

abigen --abi <(curl -s https://raw.githubusercontent.com/AudiusProject/audius-protocol/main/packages/libs/src/eth-contracts/ABIs/ServiceProviderFactory.json | jq '.abi') --pkg gen --type ServiceProviderFactory --out ./gen/service_provider_factory.go

abigen --abi <(curl -s https://raw.githubusercontent.com/AudiusProject/audius-protocol/main/packages/libs/src/eth-contracts/ABIs/ServiceTypeManager.json | jq '.abi') --pkg gen --type ServiceTypeManager --out ./gen/service_type_manager.go

abigen --abi <(curl -s https://raw.githubusercontent.com/AudiusProject/audius-protocol/main/packages/libs/src/eth-contracts/ABIs/ClaimsManager.json | jq '.abi') --pkg gen --type ClaimsManager --out ./gen/claims_manager.go

abigen --abi <(curl -s https://raw.githubusercontent.com/AudiusProject/audius-protocol/main/packages/libs/src/eth-contracts/ABIs/DelegateManagerV2.json | jq '.abi') --pkg gen --type DelegateManager --out ./gen/delegate_manager.go

abigen --abi <(curl -s https://raw.githubusercontent.com/AudiusProject/audius-protocol/main/packages/libs/src/eth-contracts/ABIs/AudiusToken.json | jq '.abi') --pkg gen --type AudiusToken --out ./gen/audius_token.go

abigen --abi <(curl -s https://raw.githubusercontent.com/AudiusProject/audius-protocol/main/packages/libs/src/eth-contracts/ABIs/EthRewardsManager.json | jq '.abi') --pkg gen --type EthRewardsManager --out ./gen/eth_rewards_manager.go
