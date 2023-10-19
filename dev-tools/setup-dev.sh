#!/usr/bin/env bash

# This script is meant for debian/ubuntu systems; support for other os might be added in the future

# Install nvm and required node versions
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
source ~/.nvm/nvm.sh
source ~/.bashrc
for dir in contracts eth-contracts packages/identity-service libs; do
    cd "$PROTOCOL_DIR/$dir"
    nvm install
done
