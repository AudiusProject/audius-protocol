#!/usr/bin/env bash
set -euo pipefail

# TODO - MOVE OUT OF SHELL SCRIPT ASAP

# anchor build
# anchor deploy --provider.cluster http://solana:8899

ANCHOR_PROGRAM_DIR="$PROTOCOL_DIR/solana-programs/anchor/audius-data"
OWNER_KEYPAIR_PATH="$HOME/.config/solana/id.json"
ADMIN_KEYPAIR_PATH="$PWD/adminKeypair.json"
ADMIN_STORAGE_KEYPAIR_PATH="$PWD/adminStorageKeypair.json"
USER_KEYPAIR_PATH="$PWD/userKeypair.json"
AUDIUS_DATA_PROGRAM_ID=$(solana-keygen pubkey $PWD/target/deploy/audius_data-keypair.json)

cd "$ANCHOR_PROGRAM_DIR"

echo "Seeding transactions..."

solana airdrop 100

# echo "disable admin"
yarn run ts-node cli/main.ts -f updateAdmin \
    -k "$OWNER_KEYPAIR_PATH" \
    --admin-keypair "$ADMIN_KEYPAIR_PATH" \
    --admin-storage-keypair "$ADMIN_STORAGE_KEYPAIR_PATH" \
    --write-enabled false \
    --network http://solana:8899


echo "create user"
yarn run ts-node cli/main.ts -f createUser \
    -k "$OWNER_KEYPAIR_PATH" \
    --user-id 23 \
    --admin-keypair "$ADMIN_KEYPAIR_PATH" \
    --admin-storage-keypair "$ADMIN_STORAGE_KEYPAIR_PATH" \
    --user-replica-set 1,2,3 \
    --user-solana-keypair "$USER_KEYPAIR_PATH" \
    --eth-address 0x835EF8f4D938161A03a55534165f2368fBE67B56 \
    --eth-private-key 7fc1324a1be2dcd8a9841f3a7b1ae830c0a42de215fb8da6884c4541de882b90 \
    --network http://solana:8899 \
    --metadata QmaTH6huXKsTXV4jHbHVGgwA5ybBHGqZxmbwkFA7YitVgS
