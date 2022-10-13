#!/bin/sh
set -o xtrace
set -e

link_libs=true

if [ "$link_libs" = true ]; then
    cd ../audius-libs
    npm link
    cd ../app
    npm link @audius/sdk
    npx nodemon --exec 'node --inspect=0.0.0.0:9229 --require ts-node/register src/index.ts'  --watch src --watch ../audius-libs/dist  --ignore "./emailCache" 
else
    npx nodemon --exec 'node --inspect=0.0.0.0:9229 --require ts-node/register src/index.ts' --ignore "./emailCache" 
fi
