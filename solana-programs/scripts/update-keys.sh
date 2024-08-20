#!/usr/bin/env bash

set -e

function replace_address {
    if [[ "$OSTYPE" =~ ^darwin ]]; then
        current_address=$(grep 'declare_id' $1 | awk -F'"' '{print $2}')
    else
        current_address=$(grep -Po '(?<=declare_id!\(").*(?=")' $1)
    fi

    new_address=$(solana address -k ${@: -1})

    # do not touch the files if the address is the same
    # this is done so that rust can use incremental compilation
    if [[ "$current_address" != "$new_address" ]]; then
        for file in "${@:1:$#-1}"; do
            echo "Replacing $current_address with $new_address in $file"
            if [[ "$OSTYPE" =~ ^darwin ]]; then
                # osx requires a backup file to be created when using sed
                sed -i'.backup' "s/$current_address/$new_address/g" $file
            else
                sed -i "s/$current_address/$new_address/g" $file
            fi
        done
    fi
}

function generate_key {
    if [[ "$2" != "" ]]; then
        echo $2 >$1
    else
        solana-keygen new -f -s --no-bip39-passphrase -o $1
    fi
}

function restore_backup {
    if [[ -f "$1.backup" ]]; then
        echo "Restoring $1..."
        mv "$1.backup" "$1"
    fi
}

# cd into solana-programs
cd $(dirname "$(readlink -f "$0")")/..

# when running on host, env is missing what would be docker build args
if [[ "$OSTYPE" =~ ^darwin ]]; then
    echo "Sourcing from compose/.env"
    set -a
    source  ../dev-tools/compose/.env
    set +a
fi

if [[ "$1" = "restore" ]]; then
    echo "Restoring program IDs..."
    restore_backup audius_eth_registry/src/lib.rs
    restore_backup track_listen_count/src/lib.rs
    restore_backup claimable-tokens/program/src/lib.rs
    restore_backup reward-manager/program/src/lib.rs
    restore_backup payment-router/programs/payment-router/src/lib.rs
    restore_backup payment-router/Anchor.toml
else
    echo "Replacing program keys..."
    mkdir -p ${CARGO_TARGET_DIR:-target}/deploy

    generate_key ${CARGO_TARGET_DIR:-target}/deploy/audius_eth_registry-keypair.json "$SOLANA_AUDIUS_ETH_REGISTRY_SECRET_KEY"
    replace_address audius_eth_registry/src/lib.rs ${CARGO_TARGET_DIR:-target}/deploy/audius_eth_registry-keypair.json

    generate_key ${CARGO_TARGET_DIR:-target}/deploy/track_listen_count-keypair.json "$SOLANA_TRACK_LISTEN_COUNT_SECRET_KEY"
    replace_address track_listen_count/src/lib.rs ${CARGO_TARGET_DIR:-target}/deploy/track_listen_count-keypair.json

    generate_key ${CARGO_TARGET_DIR:-target}/deploy/claimable_tokens-keypair.json "$SOLANA_CLAIMABLE_TOKENS_SECRET_KEY"
    replace_address claimable-tokens/program/src/lib.rs ${CARGO_TARGET_DIR:-target}/deploy/claimable_tokens-keypair.json

    generate_key ${CARGO_TARGET_DIR:-target}/deploy/audius_reward_manager-keypair.json "$SOLANA_REWARD_MANAGER_SECRET_KEY"
    replace_address reward-manager/program/src/lib.rs ${CARGO_TARGET_DIR:-target}/deploy/audius_reward_manager-keypair.json

    generate_key ${CARGO_TARGET_DIR:-target}/deploy/payment_router-keypair.json "$SOLANA_PAYMENT_ROUTER_SECRET_KEY"
    replace_address \
        payment-router/programs/payment-router/src/lib.rs \
        payment-router/Anchor.toml \
        ${CARGO_TARGET_DIR:-target}/deploy/payment_router-keypair.json
fi