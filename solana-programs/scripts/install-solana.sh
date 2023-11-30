#!/usr/bin/env bash

set -ex

if [[ "$(uname -m)" == "x86_64" ]]; then
    curl -SfL https://github.com/solana-labs/solana/releases/download/v1.16.3/solana-release-x86_64-unknown-linux-gnu.tar.bz2 | tar jxf - -C $HOME
else
    curl -SfL https://github.com/solana-labs/solana/archive/refs/tags/v1.16.3.tar.gz | tar xzf - -C $HOME
    mv $HOME/solana-1.16.3 $HOME/solana-release
    cd $HOME/solana-release
    ./scripts/cargo-install-all.sh .
fi
