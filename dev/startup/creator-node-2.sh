#!/usr/bin/env sh

export delegateOwnerWallet=0x1B569e8f1246907518Ff3386D523dcF373e769B6
export delegatePrivateKey=0x1166189cdf129cdcb011f2ad0e5be24f967f7b7026d162d7c36073b12020b61c

export spOwnerWallet=0x1B569e8f1246907518Ff3386D523dcF373e769B6

export creatorNodeEndpoint="http://$(hostname -i):4000"

cd ../audius-libs
npm link

cd ../app
npm link @audius/libs

# Run register script in background as it waits for the node to be healthy
node scripts/register.js &
