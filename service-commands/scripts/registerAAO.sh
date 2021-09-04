#!/bin/bash

if [[ -z \"$AAO_DIR\" ]]; then 
  echo "!!!ERROR: need to set AAO_DIR"; 
  exit 1;
fi

eth_address=$(jq -r '.[0]' ~/.audius/aao-config.json)
cd $AAO_DIR

echo "Registering [$eth_address] with Solana rewards manager..."
cd $PROTOCOL_DIR/service-commands
node scripts/rewardManagerLocal.js register-eth-address $eth_address