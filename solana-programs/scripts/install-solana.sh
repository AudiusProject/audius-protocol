#!/usr/bin/env bash

set -ex

cargo install --locked --force --root $HOME/solana-release --version 1.16.3 solana-cli solana-keygen
cargo install --locked --force --root $HOME/solana-release --version 1.16.3 --bin solana-test-validator solana-validator
cargo install --locked --force --root $HOME/solana-release --version 3.1.0 spl-token-cli
