#!/usr/bin/env bash
set -euxo pipefail

ANCHOR_PROGRAM_DIR="$PROTOCOL_DIR/solana-programs/anchor/audius-data"
OWNER_KEYPAIR_PATH="$HOME/.config/solana/id.json"
ADMIN_KEYPAIR_PATH="$PWD/adminKeypair.json"
ADMIN_STORAGE_KEYPAIR_PATH="$PWD/adminStorageKeypair.json"
USER_KEYPAIR_PATH="$PWD/userKeypair.json"
cd "$ANCHOR_PROGRAM_DIR"

echo "Seeding transactions..."

echo "Init admin" 

yarn run ts-node cli/main.ts -f initAdmin \
    -k "$OWNER_KEYPAIR_PATH" | grep "echo" | sh

echo "Init user"

yarn run ts-node cli/main.ts -f initUser \
    -k "$OWNER_KEYPAIR_PATH" \
    --admin-keypair "$ADMIN_KEYPAIR_PATH" \
    --admin-storage-keypair "$ADMIN_STORAGE_KEYPAIR_PATH" \
    -h handlebcdef \
    -e 0x0a93d8cb0Be85B3Ea8f33FA63500D118deBc83F7 > /tmp/initUserOutput.txt

export USER_STORAGE_PUBKEY=$(cut -d '=' -f 4 <<< $(cat /tmp/initUserOutput.txt | grep userAcct))

echo "Generating new solana pubkey for user"

solana-keygen new --no-bip39-passphrase --force -o "$USER_KEYPAIR_PATH"

yarn run ts-node cli/main.ts -f initUserSolPubkey \
    -k "$OWNER_KEYPAIR_PATH" \
    --user-solana-keypair "$USER_KEYPAIR_PATH" \
    --admin-storage-keypair "$ADMIN_STORAGE_KEYPAIR_PATH" \
    --user-storage-pubkey "$USER_STORAGE_PUBKEY" \
    --eth-private-key d540ca11a0d12345f512e65e00bf8bf87435aa40b3731cbf0322971709eba60f

echo "Creating track"

yarn run ts-node cli/main.ts -f createTrack \
    -k "$OWNER_KEYPAIR_PATH" \
    --user-solana-keypair "$USER_KEYPAIR_PATH" \
    --user-storage-pubkey "$USER_STORAGE_PUBKEY" \
    --admin-storage-keypair "$ADMIN_STORAGE_KEYPAIR_PATH"

echo "Creating playlist"

yarn run ts-node cli/main.ts -f createPlaylist \
    -k "$OWNER_KEYPAIR_PATH" \
    --user-solana-keypair "$USER_KEYPAIR_PATH" \
    --user-storage-pubkey "$USER_STORAGE_PUBKEY" \
    --admin-storage-keypair "$ADMIN_STORAGE_KEYPAIR_PATH"

echo "Successfully seeded tx."