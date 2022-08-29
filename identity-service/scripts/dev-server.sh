#!/bin/sh
set -o xtrace
set -e

link_libs=true

if [ "$link_libs" = true ]; then
    cd ../audius-libs
    npm link
    cd ../app
    npm link @audius/sdk
    exec ./node_modules/.bin/nodemon --inspect=0.0.0.0:9229 --ignore "./emailCache" --watch src --watch ../audius-libs/dist src/index.js
else
    exec ./node_modules/.bin/nodemon --inspect=0.0.0.0:9229 --ignore "./emailCache" src/index.js
fi
