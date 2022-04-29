#!/bin/sh
set -o xtrace
set -e

link_libs=true

if [ "$link_libs" = true ]
then
    # Create anchor data link
    cd ../solana-programs/anchor/audius-data
    npm run dev &
    npm link
    cd ../../

    # Link anchor data to libs
    cd ../audius-libs
    npm link @audius/anchor-audius-data

    # Create libs link
    npm run dev &
    npm link

    # Link libs to app
    cd ../app
    npm link @audius/libs

    exec ./node_modules/.bin/nodemon --inspect=0.0.0.0:9229 --ignore "./emailCache" --watch src --watch ../audius-libs/ --watch ../solana-programs/anchor/audius-data src/index.js
else
    exec ./node_modules/.bin/nodemon --inspect=0.0.0.0:9229 --ignore "./emailCache" src/index.js
fi