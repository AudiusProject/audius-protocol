#!/usr/bin/env bash
set -e

<<COMMENT
CircleCI Specific Test Script
Removes dependency on docker container, assumes port 8546 is exposed
COMMENT

rm -rf ./build/

npm run truffle-compile

sh ./scripts/lint.sh

printf '\nSTART Truffle tests:\n\n'

npm run test-coverage
