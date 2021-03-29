FROM ubuntu:20.04

RUN apt-get update && \
    apt-get install -y jq curl build-essential libudev-dev libhidapi-dev pkg-config libssl-dev git python-is-python3 && \
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y && \
    sh -c "$(curl -sSfL https://release.solana.com/v1.6.1/install)"

ENV PATH="/root/.cargo/bin:/root/.local/share/solana/install/active_release/bin:${PATH}"

RUN solana-keygen new -s --no-bip39-passphrase && \
    solana config set -u localhost
