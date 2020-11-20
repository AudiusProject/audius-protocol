#!/bin/sh
set -o xtrace
set -e

link_libs=false

if [ $CNODE_LINK_LIBS_OVERRIDE ]
then
    link_libs=$CNODE_LINK_LIBS_OVERRIDE    
fi

echo "creator-node link_libs:" $link_libs

if [ "$link_libs" = true ]
then
    cd ../audius-libs
    npm link
    cd ../app
    npm link @audius/libs
    exec ./node_modules/.bin/nodemon --watch src --watch ../audius-libs/ src/index.js | ./node_modules/.bin/bunyan
else
    exec ./node_modules/.bin/nodemon src/index.js | ./node_modules/.bin/bunyan
fi