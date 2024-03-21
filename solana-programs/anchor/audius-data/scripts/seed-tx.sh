#!/usr/bin/env bash
set -euo pipefail
set -x

# TODO - MOVE OUT OF SHELL SCRIPT ASAP

ANCHOR_PROGRAM_DIR="$(dirname "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")")"   # audius-protocol/solana-programs/anchor/audius-data
OWNER_KEYPAIR_PATH="$HOME/.config/solana/id.json"
ADMIN_AUTHORITY_KEYPAIR_PATH="$PWD/adminAuthorityKeypair.json"
ADMIN_ACCOUNT_KEYPAIR_PATH="$PWD/adminAccountKeypair.json"
USER_KEYPAIR_PATH="$PWD/userKeypair.json"
AUDIUS_DATA_PROGRAM_ID=$(solana-keygen pubkey $PWD/target/deploy/audius_data-keypair.json)

cd "$ANCHOR_PROGRAM_DIR"

echo "Seeding transactions..."

echo "Init admin"

yarn run ts-node cli/main.ts -f initAdmin \
    -k "$OWNER_KEYPAIR_PATH" | tee /tmp/initAdminOutput.txt

echo "Registering content nodes!"
# Register content nodes
yarn run ts-node cli/main.ts -f initContentNode \
    -k "$OWNER_KEYPAIR_PATH" \
    --admin-authority-keypair "$ADMIN_AUTHORITY_KEYPAIR_PATH" \
    --admin-account-keypair "$ADMIN_ACCOUNT_KEYPAIR_PATH" \
    --cn-sp-id 1

yarn run ts-node cli/main.ts -f initContentNode \
    -k "$OWNER_KEYPAIR_PATH" \
    --admin-authority-keypair "$ADMIN_AUTHORITY_KEYPAIR_PATH" \
    --admin-account-keypair "$ADMIN_ACCOUNT_KEYPAIR_PATH" \
    --cn-sp-id 2

yarn run ts-node cli/main.ts -f initContentNode \
    -k "$OWNER_KEYPAIR_PATH" \
    --admin-authority-keypair "$ADMIN_AUTHORITY_KEYPAIR_PATH" \
    --admin-account-keypair "$ADMIN_ACCOUNT_KEYPAIR_PATH" \
    --cn-sp-id 3

echo "Init user"

yarn run ts-node cli/main.ts -f initUser \
    -k "$OWNER_KEYPAIR_PATH" \
    --admin-authority-keypair "$ADMIN_AUTHORITY_KEYPAIR_PATH" \
    --admin-account-keypair "$ADMIN_ACCOUNT_KEYPAIR_PATH" \
    --user-replica-set 1,2,3 \
    --user-id 1 \
    -e 0x0a93d8cb0Be85B3Ea8f33FA63500D118deBc83F7 | tee /tmp/initUserOutput.txt

USER_ACCOUNT=$(cut -d '=' -f 4 <<< $(cat /tmp/initUserOutput.txt | grep userAcct))

echo "Generating new solana pubkey for user"

solana-keygen new --no-bip39-passphrase --force -o "$USER_KEYPAIR_PATH"

# creates 2 inner instructions - look into this?
yarn run ts-node cli/main.ts -f initUserSolPubkey \
    -k "$OWNER_KEYPAIR_PATH" \
    --user-solana-keypair "$USER_KEYPAIR_PATH" \
    --admin-account-keypair "$ADMIN_ACCOUNT_KEYPAIR_PATH" \
    --user-account "$USER_ACCOUNT" \
    --eth-private-key d540ca11a0d12345f512e65e00bf8bf87435aa40b3731cbf0322971709eba60f

echo "Creating track"

yarn run ts-node cli/main.ts -f createTrack \
    -k "$OWNER_KEYPAIR_PATH" \
    --user-solana-keypair "$USER_KEYPAIR_PATH" \
    --user-account "$USER_ACCOUNT" \
    --admin-account-keypair "$ADMIN_ACCOUNT_KEYPAIR_PATH" \
    --user-id 1 # metadata CID that would point off-chain is randomly generated here

echo "Creating playlist"

yarn run ts-node cli/main.ts -f createPlaylist \
    -k "$OWNER_KEYPAIR_PATH" \
    --user-solana-keypair "$USER_KEYPAIR_PATH" \
    --user-account "$USER_ACCOUNT" \
    --admin-account-keypair "$ADMIN_ACCOUNT_KEYPAIR_PATH" \
    --user-id 1 | tee /tmp/createPlaylistOutput.txt # metadata CID that would point off-chain is randomly generated here 

PLAYLIST_ID=$(cut -d '=' -f 3 <<< $(cat /tmp/createPlaylistOutput.txt | grep "Transacting on entity"))

echo "Updating playlist"

yarn run ts-node cli/main.ts -f updatePlaylist \
    -k "$OWNER_KEYPAIR_PATH" \
    --user-solana-keypair "$USER_KEYPAIR_PATH" \
    --user-account "$USER_ACCOUNT" \
    --admin-account-keypair "$ADMIN_ACCOUNT_KEYPAIR_PATH" \
    --id "$PLAYLIST_ID" \
    --user-id 1 # metadata CID that would point off-chain is randomly generated here 

echo "Deleting playlist"

yarn run ts-node cli/main.ts -f deletePlaylist \
    -k "$OWNER_KEYPAIR_PATH" \
    --user-solana-keypair "$USER_KEYPAIR_PATH" \
    --user-account "$USER_ACCOUNT" \
    --admin-account-keypair "$ADMIN_ACCOUNT_KEYPAIR_PATH" \
    --id "$PLAYLIST_ID" \
    --user-id 1

echo "Successfully seeded tx:"

solana transaction-history "$AUDIUS_DATA_PROGRAM_ID"
