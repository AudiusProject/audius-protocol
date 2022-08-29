#!/usr/bin/env bash

npx ganache \
  --server.host 0.0.0.0 \
  --wallet.deterministic \
  --wallet.totalAccounts 50 \
  --database.dbPath /usr/db \
  --chain.networkId 1000000000001 &

while ! node -e "require('http').request('http://poa-blockscout:4000').end()" 2>/dev/null; do
  sleep 1
done

contracts=(
  "Registry"
  "UserStorage"
  "UserFactory"
  "TrackStorage"
  "TrackFactory"
  "DiscoveryProviderStorage"
  "DiscoveryProviderFactory"
  "PlaylistStorage"
  "PlaylistFactory"
  "SocialFeatureFactory"
  "SocialFeatureStorage"
  "IPLDBlacklistFactory"
  "UserLibraryFactory"
  "UserReplicaSetManager"
  "EntityManager"
)

# verify contracts in parallel
for contract in ${contracts[@]}; do
  npx truffle run verify --network predeploy $contract &
done

wait
