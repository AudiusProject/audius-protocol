#!/usr/bin/env bash
set -euxo pipefail

RUST_VERSION=1.59.0 # rustc version 1.59.0 (9d1b2106e 2022-02-23)
SOLANA_CLI_VERSION=v1.9.13
ANCHOR_CLI_VERSION=v0.24.1

cd "$(dirname "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")")"   # audius-protocol/solana-programs/anchor/audius-data
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
SET_SOL_PATH='export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"'
TMP_SOURCE_FILE="$HOME/.tmp-anchor"
echo "$SET_SOL_PATH" | tee -a "$TMP_SOURCE_FILE"
source "$TMP_SOURCE_FILE"
rm "$TMP_SOURCE_FILE"
if ! grep -q "$SET_SOL_PATH" "$HOME/.profile"; then
  echo "$SET_SOL_PATH" | tee -a "$HOME/.profile"
fi
# set local validator
solana config set --url localhost

# install anchor
npm i -g "@project-serum/anchor-cli@$ANCHOR_CLI_VERSION"
# verify anchor version
anchor --version
# install dependencies
npm install

# init solana keypair
solana-keygen new --no-bip39-passphrase --force -o "$HOME/.config/solana/id.json"

echo "Installed deps for anchor development."
