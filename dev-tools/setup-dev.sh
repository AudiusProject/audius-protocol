#!/usr/bin/env bash

# This script is meant for debian/ubuntu systems; support for other os might be added in the future

# Install nvm and required node versions
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
source ~/.nvm/nvm.sh
source ~/.bashrc
for dir in contracts creator-node eth-contracts identity-service libs; do
    cd "$PROTOCOL_DIR/$dir"
    nvm install
done

# Link mad-dog (this is temporary, hopefully we can get mad-dog to run in docker)
cd $PROTOCOL_DIR/libs
nvm use
npm i
npm run build
npm link

cd $PROTOCOL_DIR/service-commands
npm i
npm link @audius/sdk
npm link

cd $PROTOCOL_DIR/mad-dog
npm i
npm link @audius/sdk
npm link @audius/service-commands

cd $PROTOCOL_DIR/libs
npm link
