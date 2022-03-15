#!/usr/bin/env bash
set -ex

# setup root
cd $PROTOCOL_DIR/
npm install

# setup pre-commit hooks
if command -v pre-commit &>/dev/null; then
    pre-commit install -t pre-commit -t pre-push
else
    echo "pre-commit not installed; not setting up pre-commit hooks"
fi

# setup service commands
cd $PROTOCOL_DIR/
cd service-commands/
npm install
npm install lodash # fry_kek
npm link

# setup mad dog
cd $PROTOCOL_DIR/
cd mad-dog/
npm install
npm link @audius/service-commands

# setup contracts
cd $PROTOCOL_DIR/
cd contracts/
npm install

# setup eth contracts
cd $PROTOCOL_DIR/
cd eth-contracts/
npm install

# no discovery provider setup needed
# 'pip install' is performed through Docker for development
# TODO: Revisit whether this is optimal after hot reloading for disc prov

# setup creator node
cd $PROTOCOL_DIR/
cd creator-node/
npm install

# setup libs
cd $PROTOCOL_DIR/
cd libs/
npm install
npm install lodash # lodash isn't installed on the first run for some reason...
npm install web3 # web3 has the same issue...

# setup identity service
cd $PROTOCOL_DIR/
cd identity-service/
npm install --also=dev

wait

# create link for libs
cd $PROTOCOL_DIR/
cd libs
npm link

# link service-commands to libs
cd $PROTOCOL_DIR/
cd service-commands
npm link @audius/libs

cd $PROTOCOL_DIR/
cd ..
if [ -d "audius-client" ]; then
    cd audius-client
    npm install
    npm link @audius/libs
fi
