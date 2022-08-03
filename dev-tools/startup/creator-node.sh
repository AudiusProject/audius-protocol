#!/usr/bin/env sh

export delegateOwnerWallet=$(printenv "CN${replica}_SP_OWNER_ADDRESS")
export delegatePrivateKey=$(printenv "CN${replica}_SP_OWNER_PRIVATE_KEY")

export spOwnerWallet=$(printenv "CN${replica}_SP_OWNER_ADDRESS")

export creatorNodeEndpoint="http://$(hostname -i):4000"

cd ../audius-libs
npm link

cd ../app
npm link @audius/sdk

# Run register script in background as it waits for the node to be healthy
node scripts/register.js &
