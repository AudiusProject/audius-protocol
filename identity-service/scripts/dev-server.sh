#!/bin/sh
set -o xtrace
set -e

link_libs=false

if [ "$link_libs" = true ]; then
    cd ../audius-libs
    npm link
    cd ../app
    npm link @audius/sdk
fi
 
npx ts-node-dev --respawn --inspect=0.0.0.0:9229 src/index.ts
