#!/usr/bin/env bash

set -ex

if [[ "$(uname -m)" == "x86_64" ]]; then
    curl -SfL https://github.com/solana-labs/solana/releases/download/v1.10.11/solana-release-x86_64-unknown-linux-gnu.tar.bz2 | tar jxf - -C $HOME
else
    cargo install --locked --root $HOME/solana-release --version 1.16.3 solana-cli solana-keygen
    cargo install --locked --root $HOME/solana-release --version 1.16.3 --bin solana-test-validator solana-validator
    cargo install --locked --root $HOME/solana-release --version 3.1.0 spl-token-cli
fi

cargo install --git https://github.com/coral-xyz/anchor --tag v0.28.0 anchor-cli --locked