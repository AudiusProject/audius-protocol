#!/usr/bin/env bash
set -euxo pipefail

cd "$(dirname "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")")"   # audius-protocol/solana-programs/anchor/audius-data
# Replace program ID with solana pubkey generated from anchor build
cur_address=$(grep -Po '(?<=declare_id!\(").*(?=")' programs/audius-data/src/lib.rs)
echo "Building and deploying audius_data program with anchor CLI..."
anchor build
AUDIUS_DATA_PROGRAM_ID=$(solana-keygen pubkey target/deploy/audius_data-keypair.json)
sed -i "s/$cur_address/$AUDIUS_DATA_PROGRAM_ID/g" Anchor.toml
sed -i "s/$cur_address/$AUDIUS_DATA_PROGRAM_ID/g" programs/audius-data/src/lib.rs

anchor build
echo "audius-data program built. Start solana test validator and deploy by running, in separate windows, npm run localnet-up and npm run deploy-dev."
