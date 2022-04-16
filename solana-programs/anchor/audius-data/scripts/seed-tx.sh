#!/usr/bin/env bash
set -euo pipefail
set -x

# TODO - MOVE OUT OF SHELL SCRIPT ASAP

ANCHOR_PROGRAM_DIR="$PROTOCOL_DIR/solana-programs/anchor/audius-data"
OWNER_KEYPAIR_PATH="$HOME/.config/solana/id.json"
ADMIN_KEYPAIR_PATH="$PWD/adminKeypair.json"
ADMIN_STORAGE_KEYPAIR_PATH="$PWD/adminStorageKeypair.json"
USER_KEYPAIR_PATH="$PWD/userKeypair.json"
AUDIUS_DATA_PROGRAM_ID=$(solana-keygen pubkey $PWD/target/deploy/audius_data-keypair.json)
SOLANA_HOST="http://solana:8899"

cd "$ANCHOR_PROGRAM_DIR"

echo "Seeding transactions..."


# yarn run ts-node cli/main.ts -f updateAdmin \
#     -k "$OWNER_KEYPAIR_PATH" \
#     --admin-keypair "$ADMIN_KEYPAIR_PATH" \
#     --admin-storage-keypair "$ADMIN_STORAGE_KEYPAIR_PATH" \
#     --write-enabled false \
#     --network http://solana:8899


# echo "create user"
# yarn run ts-node cli/main.ts -f createUser \
#     -k "$OWNER_KEYPAIR_PATH" \
#     --user-id 2 \
#     --admin-keypair "$ADMIN_KEYPAIR_PATH" \
#     --admin-storage-keypair "$ADMIN_STORAGE_KEYPAIR_PATH" \
#     --user-replica-set 1,2,3 \
#     --user-solana-keypair "$USER_KEYPAIR_PATH" \
#     --eth-address 0x835EF8f4D938161A03a55534165f2368fBE67B56 \
#     --eth-private-key 7fc1324a1be2dcd8a9841f3a7b1ae830c0a42de215fb8da6884c4541de882b90 \
#     --network http://solana:8899 \
#     --metadata "QmQNV2YWbA4jfmJie5eEBD1FAAtsZER56aRDNWFB2kU87P"

# echo "Creating track"

yarn run ts-node cli/main.ts -f createTrack \
    -k "$OWNER_KEYPAIR_PATH" \
    --user-solana-keypair "$USER_KEYPAIR_PATH" \
    --admin-storage-keypair "$ADMIN_STORAGE_KEYPAIR_PATH" \
    --metadata "QmeVZehmcR5TTJWUrVvp52J67qpSAwqSKNxMCJuLKJnMwm" \
    --user-id 1 


# solana transaction-history "$AUDIUS_DATA_PROGRAM_ID"