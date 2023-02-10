#!/usr/bin/env bash

set -e

npx ganache -p 8555 -a 50 --hardfork istanbul --logging.quiet &
ganache_pid=$!

node_modules/.bin/truffle test --network test_local "$@"

kill "$ganache_pid"
