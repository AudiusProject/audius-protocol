#!/usr/bin/env bash
set -ex

####################################
####### INSTALL DEPENDENCIES #######
####################################

# setup root
cd $PROTOCOL_DIR/
npm install

# setup pre-commit hooks
if ! command -v pre-commit &>/dev/null; then
    echo "pre-commit not installed; not setting up pre-commit hooks"
else
    pre-commit install -t pre-commit -t pre-push
fi

cd $PROTOCOL_DIR/service-commands
npm install

cd $PROTOCOL_DIR/mad-dog
npm install
mkdir -p local-storage/tmp-imgs

cd $PROTOCOL_DIR/contracts
npm install

cd $PROTOCOL_DIR/eth-contracts
npm install

# no discovery provider setup needed
# 'pip install' is performed through Docker for development
# TODO: Revisit whether this is optimal after hot reloading for disc prov

cd $PROTOCOL_DIR/creator-node
npm install

cd $PROTOCOL_DIR/solana-programs/anchor/audius-data
npm run install-dev
# npm run build

cd $PROTOCOL_DIR/libs
npm install
npm run build

cd $PROTOCOL_DIR/identity-service
npm install

# cd $PROTOCOL_DIR/..
# if [ -d "audius-client" ]; then
#     cd audius-client
#     npm run init
# fi

####################################
######## LINK DEPENDENCIES #########
####################################

cd $PROTOCOL_DIR/service-commands
npm link

cd $PROTOCOL_DIR/solana-programs/anchor/audius-data
npm link

cd $PROTOCOL_DIR/libs
npm link @audius/anchor-audius-data
npm link

cd $PROTOCOL_DIR/mad-dog
npm link @audius/service-commands

cd $PROTOCOL_DIR/service-commands
npm link @audius/sdk

cd $PROTOCOL_DIR/creator-node
npm link @audius/sdk

cd $PROTOCOL_DIR/identity-service
npm link @audius/sdk

cd $PROTOCOL_DIR/..
if [ -d "audius-client" ]; then
    cd audius-client
    cd packages/web && npm link @audius/sdk
fi
