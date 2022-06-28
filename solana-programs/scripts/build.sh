#!/usr/bin/env bash

set -e

function replace_address {
    current_address=$(grep -Po '(?<=declare_id!\(").*(?=")' $1)
    new_address=$(solana address -k ${@: -1})

    # do not touch the files if the address is the same
    # this is done so that rust can use incremental compilation
    if [[ "$current_address" != "$new_address" ]]; then
        for file in "${@:1:$#-1}"; do
            echo "Replacing $current_address with $new_address in $file"
            sed -i "s/$current_address/$new_address/g" $1
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

mkdir -p ${CARGO_TARGET_DIR:-target}/deploy anchor/audius-data/target/deploy

generate_key ${CARGO_TARGET_DIR:-target}/deploy/audius_eth_registry-keypair.json "$AUDIUS_ETH_REGISTRY_PRIVATE_KEY"
replace_address audius_eth_registry/src/lib.rs ${CARGO_TARGET_DIR:-target}/deploy/audius_eth_registry-keypair.json

generate_key ${CARGO_TARGET_DIR:-target}/deploy/track_listen_count-keypair.json "$TRACK_LISTEN_COUNT_PRIVATE_KEY"
replace_address track_listen_count/src/lib.rs ${CARGO_TARGET_DIR:-target}/deploy/track_listen_count-keypair.json

generate_key ${CARGO_TARGET_DIR:-target}/deploy/claimable_tokens-keypair.json "$CLAIMABLE_TOKENS_PRIVATE_KEY"
replace_address claimable-tokens/program/src/lib.rs ${CARGO_TARGET_DIR:-target}/deploy/claimable_tokens-keypair.json

generate_key ${CARGO_TARGET_DIR:-target}/deploy/audius_reward_manager-keypair.json "$REWARD_MANAGER_PRIVATE_KEY"
replace_address reward-manager/program/src/lib.rs ${CARGO_TARGET_DIR:-target}/deploy/audius_reward_manager-keypair.json

generate_key ${CARGO_TARGET_DIR:-anchor/audius-data/target}/deploy/audius_data-keypair.json "$AUDIUS_DATA_PRIVATE_KEY"
replace_address \
    anchor/audius-data/programs/audius-data/src/lib.rs \
    anchor/audius-data/Anchor.toml \
    ${CARGO_TARGET_DIR:-anchor/audius-data/target}/deploy/audius_data-keypair.json

cargo build-bpf
cargo build -p audius-eth-registry-cli
cargo build -p claimable-tokens-cli
cargo build -p audius-reward-manager-cli

cd anchor/audius-data
anchor build
