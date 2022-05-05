#!/bin/bash

function airdrop_till {
    failed=0
    while [[ "$(solana balance $1 | sed 's/\(\.\| \).*//')" < "$2" ]]; do
        # NOTE: adjust number below if running against a diffrent endpoint
        solana airdrop 20 $1

        failed=$((failed+$?))
        if [[ $failed == 5 ]]; then
            echo "Failed to airdrop $2 to $1"
            exit 1
        fi

        sleep 1
    done
}

{
    cd $(dirname "$(readlink -f "$0")")

    solana -V
    solana config set -u $SOLANA_HOST

    echo "---------------- Compile Programs ---------------"

    cargo build-bpf
    cargo build -p audius-eth-registry-cli
    cargo build -p claimable-tokens-cli
    cargo build -p audius-reward-manager-cli

    cd anchor/audius-data
    anchor build
    cd ../..

    echo "-------------- Generating Accounts --------------"

    echo "Generating eth account"
    cd anchor/audius-data/
    eth_account=$(node -e 'console.log(JSON.stringify(new (require("web3"))().eth.accounts.create()))')
    eth_address=$(echo "$eth_account" | jq -r '.address' | tail -c+3)
    eth_private_key=$(echo "$eth_account" | jq -r '.privateKey' | tail -c+3)
    cd ../..
    echo $eth_account
    echo

    echo "Generating owner account"
    owner_keypair_path=$HOME/.config/solana/id.json
    solana-keygen new -s -f --no-bip39-passphrase -o "$owner_keypair_path"
    solana address
    echo

    echo "Generating feepayer account"
    feepayer_keypair_path=$HOME/.config/solana/keypair.json
    solana-keygen new -s -f --no-bip39-passphrase -o "$feepayer_keypair_path"
    solana address -k "$feepayer_keypair_path"
    echo

    echo "Generating token keypair"
    token_keypair_path=$HOME/.config/solana/token.json
    solana-keygen new -s -f --no-bip39-passphrase -o "$token_keypair_path"
    solana address -k "$token_keypair_path"
    echo

    echo "Generating admin authority keypair"
    admin_authority_keypair_path=$HOME/.config/solana/admin-authority.json
    solana-keygen new -s -f --no-bip39-passphrase -o "$admin_authority_keypair_path"
    solana address -k "$admin_authority_keypair_path"
    echo

    echo "Generating admin account keypair"
    admin_account_keypair_path=$HOME/.config/solana/admin.json
    solana-keygen new -s -f --no-bip39-passphrase -o "$admin_account_keypair_path"
    solana address -k "$admin_account_keypair_path"
    echo

    echo "Generating signer group keypair"
    signer_group_keypair_path=$HOME/.config/solana/signer-group.json
    solana-keygen new -s -f --no-bip39-passphrase -o "$signer_group_keypair_path"
    solana address -k "$signer_group_keypair_path"
    echo

    echo "Generating valid signer keypair"
    valid_signer_keypair_path=$HOME/.config/solana/valid-signer.json
    solana-keygen new -s -f --no-bip39-passphrase -o "$valid_signer_keypair_path"
    solana address -k "$valid_signer_keypair_path"
    echo

    echo "---------------- Airdrop solana -----------------"

    echo "Airdropping to owner account"
    airdrop_till "$owner_keypair_path" 20
    echo

    echo "Airdropping to feepayer account"
    airdrop_till "$feepayer_keypair_path" 20
    echo

    echo "------------- Deploying programs ----------------"

    echo "Deploying audius-eth-registry..."
    solana program deploy target/deploy/audius_eth_registry.so
    echo

    echo "Deploying audius-track-listen-count..."
    solana program deploy target/deploy/track_listen_count.so
    echo

    echo "Deploying audius-claimable-tokens..."
    solana program deploy target/deploy/claimable_tokens.so
    echo

    echo "Deploying audius-reward-manager..."
    solana program deploy target/deploy/audius_reward_manager.so
    echo

    echo "Deplyoing audius-data..."
    cd anchor/audius-data/
    anchor deploy --provider.cluster "$SOLANA_HOST"
    cd ../..
    echo

    echo "Deploying wAUDIO token..."
    spl-token create-token --decimals 8 -- "$token_keypair_path"
    echo

    echo "------------- Initialize programs ---------------"

    echo "Creating a signer group..."
    ./target/debug/audius-eth-registry-cli create-signer-group "$signer_group_keypair_path"
    echo

    echo "Creating a valid signer..."
    ./target/debug/audius-eth-registry-cli create-valid-signer \
        "$(solana address -k "$signer_group_keypair_path")" \
        "$eth_address" \
        "$valid_signer_keypair_path"
    echo

    echo "Creating wAUDIO token account..."
    spl-token create-account "$(solana address -k "$token_keypair_path")"
    echo

    echo "Minting 100,000,000 wAUDIO..."
    spl-token mint "$(solana address -k "$token_keypair_path")" 100000000
    echo

    echo "Initalizing claimable tokens..."
    ./target/debug/claimable-tokens-cli \
        generate-base-pda \
        "$(solana address -k "$token_keypair_path")" \
        "$(solana address -k target/deploy/claimable_tokens-keypair.json)"
    echo

    echo "Initalizing reward manager..."
    output=$(
        ./target/debug/audius-reward-manager-cli \
            init \
            --min-votes 2 \
            --token-mint "$(solana address -k $token_keypair_path)" \
        | tee /dev/tty
    )
    reward_manager_account="$(grep -Po '(?<=Reward manager key created: ).*' <<< "$output")"
    reward_manager_token_account="$(grep -Po '(?<=Reward manager token key created: ).*' <<< "$output")"

    ./target/debug/audius-reward-manager-cli \
        create-sender \
        --eth-operator-address 0xF24936714293a0FaF39A022138aF58D874289132 \
        --eth-sender-address 0xF24936714293a0FaF39A022138aF58D874289133 \
        --reward-manager $reward_manager_account
    echo

    echo "Transferring wAUDIO to audius-reward-manager..."
    spl-token transfer "$(solana address -k $token_keypair_path)" 100000000 "$reward_manager_token_account"
    echo

    echo "Initializing audius admin account..."
    cd anchor/audius-data/
    yarn run ts-node cli/main.ts \
        --function initAdmin \
        --admin-authority-keypair "$admin_authority_keypair_path" \
        --admin-account-keypair "$admin_account_keypair_path" \
        --owner-keypair "$owner_keypair_path" \
        --network "$SOLANA_HOST"
    cd ../..
    echo

    echo "Initializing Content/URSM nodes..."
    cd anchor/audius-data/
    # initialize Content/URSM nodes - initContentNode uses deterministic 
    # addresses and pkeys from eth-contracts ganache chain.
    yarn run ts-node cli/main.ts \
        --function initContentNode \
        --admin-authority-keypair "$admin_authority_keypair_path" \
        --admin-account-keypair "$admin_account_keypair_path" \
        --owner-keypair "$owner_keypair_path" \
        --cn-sp-id 1 \
        --network "$SOLANA_HOST"

    yarn run ts-node cli/main.ts \
        --function initContentNode \
        --admin-authority-keypair "$admin_authority_keypair_path" \
        --admin-account-keypair "$admin_account_keypair_path" \
        --owner-keypair "$owner_keypair_path" \
        --cn-sp-id 2 \
        --network "$SOLANA_HOST"

    yarn run ts-node cli/main.ts \
        --function initContentNode \
        --admin-authority-keypair "$admin_authority_keypair_path" \
        --admin-account-keypair "$admin_account_keypair_path" \
        --owner-keypair "$owner_keypair_path" \
        --cn-sp-id 3 \
        --network "$SOLANA_HOST"
    cd ../..
    echo
} >&2

# TODO follow up PR on cleaning up anchor admin storage naming
cat <<EOF
{
    "endpoint": "$SOLANA_HOST",

    "ownerWalletPubkey": "$(solana address -k "$owner_keypair_path")",
    "ownerWallet": $(cat "$owner_keypair_path"),

    "feePayerWalletPubkey": "$(solana address -k "$feepayer_keypair_path")",
    "feePayerWallets": [{ "privateKey": $(cat "$feepayer_keypair_path") }],

    "audiusEthRegistryAddress": "$(solana address -k target/deploy/audius_eth_registry-keypair.json)",
    "trackListenCountAddress": "$(solana address -k target/deploy/track_listen_count-keypair.json)",
    "claimableTokenAddress": "$(solana address -k target/deploy/claimable_tokens-keypair.json)",
    "rewardsManagerAddress": "$(solana address -k target/deploy/audius_reward_manager-keypair.json)",
    "anchorProgramId": "$(solana address -k anchor/audius-data/target/deploy/audius_data-keypair.json)",

    "signerGroup": "$(solana address -k "$signer_group_keypair_path")",
    "validSigner": "$(solana address -k "$valid_signer_keypair_path")",
    "signerPrivateKey": "$eth_private_key",

    "anchorAdminAuthorityPublicKey": "$(solana address -k "$admin_authority_keypair_path")",
    "anchorAdminAuthorityPrivateKey": $(cat "$admin_authority_keypair_path"),

    "anchorAdminAccountPublicKey": "$(solana address -k "$admin_account_keypair_path")",
    "anchorAdminAccountPrivateKey": $(cat "$admin_account_keypair_path"),

    "splToken": "$(solana address -k "$token_keypair_path")",
    "splTokenAccount": "$(spl-token address --token "$token_keypair_path" --verbose --output json | jq -r '.associatedTokenAddress')",

    "rewardsManagerAccount": "$reward_manager_account",
    "rewardsManagerTokenAccount": "$reward_manager_token_account"
}
EOF
