#!/usr/bin/env bash
set -euxo pipefail

RUST_VERSION=1.59.0 # rustc version 1.59.0 (9d1b2106e 2022-02-23)
SOLANA_CLI_VERSION=v1.9.1
ANCHOR_CLI_VERSION=v0.22.1

cd $PROTOCOL_DIR/solana-programs/anchor/audius-data
echo "Installing dev deps for anchor audius-data development..."
# install rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "${CARGO_HOME:-"$HOME/.cargo"}/env"
# pin rustc version
rustup default "$RUST_VERSION"
rustup component add rustfmt

# install solana
sh -c "$(curl -sSfL https://release.solana.com/$SOLANA_CLI_VERSION/install)"
# add solana to PATH
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# install yarn
npm install -g yarn
# install anchor
npm i -g "@project-serum/anchor-cli@$ANCHOR_CLI_VERSION"
# verify anchor version
anchor --version
# install dependencies
yarn install

# init solana keypair
solana-keygen new --no-bip39-passphrase --force -o "~/.config/solana/id.json"

if [[ "${CI:-false}" == false ]]; then
    # reload shell 
    exec $SHELL
fi
echo "Installed deps for anchor development."