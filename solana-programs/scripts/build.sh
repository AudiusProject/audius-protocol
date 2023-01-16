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

    if [[ $BUILDTARGET == "x86_64" ]]; then
        # on M1 (arm64) these files are built on separate stage
        cargo build-bpf
        cd anchor/audius-data && anchor build
    fi
fi
