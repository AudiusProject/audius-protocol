#!/usr/bin/env bash

<<COMMENT
CircleCI Specific Test Script
Removes dependency on docker container, assumes port 8546 is exposed
COMMENT

rm -rf ./build/

npm run truffle-compile

printf '\nSTART Truffle tests:\n\n'

npm run test
