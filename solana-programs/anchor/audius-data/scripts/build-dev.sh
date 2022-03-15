#!/usr/bin/env bash
set -euxo pipefail

cd $PROTOCOL_DIR/solana-programs/anchor/audius-data
echo "Building and deploying audius-data program with anchor CLI..."
anchor build
sed -i "s/Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS/$(solana-keygen pubkey target/deploy/audius_data-keypair.json)/g" Anchor.toml
sed -i "s/Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS/$(solana-keygen pubkey target/deploy/audius_data-keypair.json)/g" programs/audius-data/src/lib.rs

anchor build
echo "audius-data program built. Start solana test validator and deploy by running, in separate windows, npm run localnet-up and npm run deploy-dev."