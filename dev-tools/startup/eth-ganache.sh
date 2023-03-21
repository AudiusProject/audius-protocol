#!/usr/bin/env bash

export NODE_OPTIONS=“-—max-old-space-size=8192”

npx ganache \
  --server.host 0.0.0.0 \
  --wallet.deterministic \
  --wallet.totalAccounts 50 \
  --database.dbPath /usr/db \
  --chain.networkId 12345 &

while ! node -e "require('http').request('http://eth-blockscout:4000').end()" 2>/dev/null; do
  sleep 1
done

# Mapping of Registry Key to Contract Name
declare -A contracts=(
  [ClaimsManagerProxy]=ClaimsManager
  [DelegateManager]=DelegateManager
  [EthRewardsManagerProxy]=EthRewardsManager
  [Governance]=Governance
  [Registry]=Registry
  [ServiceProviderFactory]=ServiceProviderFactory
  [ServiceTypeManagerProxy]=ServiceTypeManager
  [StakingProxy]=Staking
  [Token]=AudiusToken
  [TrustedNotifierManagerProxy]=TrustedNotifierManager
  [WormholeClientProxy]=WormholeClient
)

# verify contracts in parallel
for registry_key in ${!contracts[@]}; do
  address=$(npx truffle exec --quiet --network predeploy scripts/get-address.js "$registry_key" | tail -n1)
  npx truffle run verify --network predeploy --custom-proxy AudiusAdminUpgradeabilityProxy "${contracts[$registry_key]}@$address" &
done

wait
