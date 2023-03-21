#!/usr/bin/env bash

set -ex

# TODO: refactor os switching

# cd into solana-programs
cd $(dirname "$(readlink -f "$0")")/..

./scripts/update-keys.sh

if [[ ! "$OSTYPE" =~ ^darwin ]]; then
    cargo install --debug --target-dir ./target --path cli
    cargo install --debug --target-dir ./target --path reward-manager/cli
    cargo install --debug --target-dir ./target --path claimable-tokens/cli
fi
