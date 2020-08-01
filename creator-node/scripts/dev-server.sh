#!/bin/sh
set -o xtrace
set -e

cd ../audius-libs
npm link
cd ../app
npm link @audius/libs
exec ./node_modules/.bin/nodemon src/index.js | ./node_modules/.bin/bunyan