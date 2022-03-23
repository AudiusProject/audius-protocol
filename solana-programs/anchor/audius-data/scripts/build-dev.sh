#!/usr/bin/env bash
set -euxo pipefail

cd $PROTOCOL_DIR/solana-programs/anchor/audius-data
echo "Building and deploying audius_data program with anchor CLI..."
anchor build
AUDIUS_DATA_PROGRAM_ID=$(solana-keygen pubkey target/deploy/audius_data-keypair.json)
sed -i "s/Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS/$AUDIUS_DATA_PROGRAM_ID/g" Anchor.toml
sed -i "s/Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS/$AUDIUS_DATA_PROGRAM_ID/g" programs/audius-data/src/lib.rs

anchor build
echo "audius-data program built. Start solana test validator and deploy by running, in separate windows, npm run localnet-up and npm run deploy-dev."