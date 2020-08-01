#!/bin/sh
set -o xtrace
set -e

link_libs=false

if [ "$link_libs" = true ] ; then
    cd ../audius-libs
    npm link
    cd ../app
    npm link @audius/libs
fi

exec ./node_modules/.bin/nodemon src/index.js | ./node_modules/.bin/bunyan