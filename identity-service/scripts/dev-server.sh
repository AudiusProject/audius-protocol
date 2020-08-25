#!/bin/sh
set -o xtrace
set -e

link_libs=true

if [ "$link_libs" = true ]
then
    cd ../audius-libs
    npm link
    cd ../app
    npm link @audius/libs
    exec ./node_modules/.bin/nodemon --ignore "./emailCache" --watch src --watch ../audius-libs/ src/index.js
else
    exec ./node_modules/.bin/nodemon --ignore "./emailCache" src/index.js
fi