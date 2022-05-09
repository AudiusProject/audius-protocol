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

# cd into solana-programs
cd $(dirname "$(readlink -f "$0")")/..

mkdir -p target/deploy anchor/audius-data/target/deploy

if [[ "$AUDIUS_ETH_REGISTRY_PRIVATE_KEY" != "" ]]; then
    echo "$AUDIUS_ETH_REGISTRY_PRIVATE_KEY" > anchor/audius-data/target/deploy/audius_eth_registry-keypair.json
else
    solana-keygen new -f -s --no-bip39-passphrase -o target/deploy/audius_eth_registry-keypair.json
fi
replace_address audius_eth_registry/src/lib.rs target/deploy/audius_eth_registry-keypair.json

if [[ "$TRACK_LISTEN_COUNT_PRIVATE_KEY" != "" ]]; then
    echo "$TRACK_LISTEN_COUNT_PRIVATE_KEY" > target/deploy/track_listen_count-keypair.json
else
    solana-keygen new -f -s --no-bip39-passphrase -o target/deploy/track_listen_count-keypair.json
fi
replace_address track_listen_count/src/lib.rs target/deploy/track_listen_count-keypair.json

if [[ "$CLAIMABLE_TOKENS_PRIVATE_KEY" != "" ]]; then
    echo "$CLAIMABLE_TOKENS_PRIVATE_KEY" > target/deploy/claimable_tokens-keypair.json
else
    solana-keygen new -f -s --no-bip39-passphrase -o target/deploy/claimable_tokens-keypair.json
fi
replace_address claimable-tokens/program/src/lib.rs target/deploy/claimable_tokens-keypair.json

if [[ "$REWARD_MANAGER_PRIVATE_KEY" != "" ]]; then
    echo "$REWARD_MANAGER_PRIVATE_KEY" > target/deploy/audius_reward_manager-keypair.json
else
    solana-keygen new -f -s --no-bip39-passphrase -o target/deploy/audius_reward_manager-keypair.json
fi
replace_address reward-manager/program/src/lib.rs target/deploy/audius_reward_manager-keypair.json

if [[ "$AUDIUS_DATA_PRIVATE_KEY" != "" ]]; then
    echo "$AUDIUS_DATA_PRIVATE_KEY" > anchor/audius-data/target/deploy/audius_data-keypair.json
else
    solana-keygen new -f -s --no-bip39-passphrase -o anchor/audius-data/target/deploy/audius_data-keypair.json
fi
replace_address \
    anchor/audius-data/programs/audius-data/src/lib.rs \
    anchor/audius-data/Anchor.toml \
    anchor/audius-data/target/deploy/audius_data-keypair.json

cargo build-bpf
cargo build -p audius-eth-registry-cli
cargo build -p claimable-tokens-cli
cargo build -p audius-reward-manager-cli

cd anchor/audius-data
anchor build
