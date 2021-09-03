#!/bin/bash

if [[ -z \"$AAO_DIR\" ]]; then 
  echo "!!!ERROR: need to set AAO_DIR"; 
  exit 1;
fi

# This has to match what's in the eth_rewards_manager_migration.js
ETH_ADDRESS_INDEX=12
eth_address=$(jq -r '.allWallets['$ETH_ADDRESS_INDEX']' ~/.audius/eth-config.json)
cd $AAO_DIR

# eth_address=$(grep -Po '(?<=ethOwnerWallet=).*' .env.development)

echo "Registering [$eth_address] with Solana rewards manager..."
cd $PROTOCOL_DIR/service-commands
node scripts/rewardManagerLocal.js register-eth-address $eth_address