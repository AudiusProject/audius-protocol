#!/usr/bin/env bash

set -ex


# Installs Solana CLIs either from the install script (for available builds like linux x86_64)
# or using Cargo to build from source (for unavailable builds like linux aarch64)
if [[ "$(uname -m)" == "x86_64" ]]; then
    curl -SfL https://github.com/solana-labs/solana/releases/download/v1.18.22/solana-release-x86_64-unknown-linux-gnu.tar.bz2 | tar jxf - -C $HOME
else
    # solana-test-validator is pulled from the solana-validator package where it's built. The solana-test-validator package has no binaries
    cargo install --locked --root $HOME/solana-release --version 1.18.22 --bin solana-test-validator solana-validator
fi
