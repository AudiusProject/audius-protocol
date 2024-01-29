#!/usr/bin/env bash

set -ex

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
                sed -i'.backup' "s/$current_address/$new_address/g" $1
            else
                sed -i "s/$current_address/$new_address/g" $1
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

# cd into solana-programs
cd $(dirname "$(readlink -f "$0")")/..

# when running on host, env is missing what would be docker build args
if [[ "$OSTYPE" =~ ^darwin ]]; then
    export AUDIUS_ETH_REGISTRY_PRIVATE_KEY=$(grep SOLANA_AUDIUS_ETH_REGISTRY_SECRET_KEY ../.env | tr -d ' ' | cut -d'=' -f2 | tr -d "'")
    export TRACK_LISTEN_COUNT_PRIVATE_KEY=$(grep SOLANA_TRACK_LISTEN_COUNT_SECRET_KEY ../.env | tr -d ' ' | cut -d'=' -f2 | tr -d "'")
    export CLAIMABLE_TOKENS_PRIVATE_KEY=$(grep SOLANA_CLAIMABLE_TOKENS_SECRET_KEY ../.env | tr -d ' ' | cut -d'=' -f2 | tr -d "'")
    export REWARD_MANAGER_PRIVATE_KEY=$(grep SOLANA_REWARD_MANAGER_SECRET_KEY ../.env | tr -d ' ' | cut -d'=' -f2 | tr -d "'")
    export PAYMENT_ROUTER_PRIVATE_KEY=$(grep SOLANA_PAYMENT_ROUTER_SECRET_KEY ../.env | tr -d ' ' | cut -d'=' -f2 | tr -d "'")
fi

mkdir -p ${CARGO_TARGET_DIR:-target}/deploy

generate_key ${CARGO_TARGET_DIR:-target}/deploy/audius_eth_registry-keypair.json "$AUDIUS_ETH_REGISTRY_PRIVATE_KEY"
replace_address audius_eth_registry/src/lib.rs ${CARGO_TARGET_DIR:-target}/deploy/audius_eth_registry-keypair.json

generate_key ${CARGO_TARGET_DIR:-target}/deploy/track_listen_count-keypair.json "$TRACK_LISTEN_COUNT_PRIVATE_KEY"
replace_address track_listen_count/src/lib.rs ${CARGO_TARGET_DIR:-target}/deploy/track_listen_count-keypair.json

generate_key ${CARGO_TARGET_DIR:-target}/deploy/claimable_tokens-keypair.json "$CLAIMABLE_TOKENS_PRIVATE_KEY"
replace_address claimable-tokens/program/src/lib.rs ${CARGO_TARGET_DIR:-target}/deploy/claimable_tokens-keypair.json

generate_key ${CARGO_TARGET_DIR:-target}/deploy/audius_reward_manager-keypair.json "$REWARD_MANAGER_PRIVATE_KEY"
replace_address reward-manager/program/src/lib.rs ${CARGO_TARGET_DIR:-target}/deploy/audius_reward_manager-keypair.json

generate_key ${CARGO_TARGET_DIR:-target}/deploy/payment_router-keypair.json "$PAYMENT_ROUTER_PRIVATE_KEY"
replace_address \
    payment-router/programs/payment-router/src/lib.rs \
    payment-router/Anchor.toml \
    ${CARGO_TARGET_DIR:-target}/deploy/payment_router-keypair.json
