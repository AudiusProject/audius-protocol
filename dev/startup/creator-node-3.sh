#!/usr/bin/env sh

export delegateOwnerWallet=0xCBB025e7933FADfc7C830AE520Fb2FD6D28c1065
export delegatePrivateKey=0x1aa14c63d481dcc1185a654eb52c9c0749d07ac8f30ef17d45c3c391d9bf68eb

export spOwnerWallet=0xCBB025e7933FADfc7C830AE520Fb2FD6D28c1065

export creatorNodeEndpoint="http://$(hostname -i):4000"

cd ../audius-libs
npm link

cd ../app
npm link @audius/libs

# Run register script in background as it waits for the node to be healthy
node scripts/register.js &
