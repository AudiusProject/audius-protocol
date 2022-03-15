#!/usr/bin/env bash
set -euxo pipefail

cd $PROTOCOL_DIR/solana-programs/anchor/audius-data
echo "Installing dev deps for anchor audius-data development..."
# install rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source $HOME/.cargo/env
rustup component add rustfmt
# install solana
sh -c "$(curl -sSfL https://release.solana.com/v1.9.1/install)"
# install yarn
npm install -g yarn
# install anchor
npm i -g @project-serum/anchor-cli
# verify anchor version
anchor --version
# install dependencies
yarn install
echo "Installed deps for anchor development."