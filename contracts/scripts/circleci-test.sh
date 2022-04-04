#!/usr/bin/env bash

<<COMMENT
CircleCI Specific Test Script
Removes dependency on docker container, assumes port 8545 is exposed
COMMENT

rm -rf ./build/

npm run truffle-compile

sh ./scripts/lint.sh

printf '\nSTART Truffle tests:\n\n'

if [ $# -eq 0 ]
	then
		node_modules/.bin/truffle test --network test_local
elif [ $1 == '--verbose-rpc' ] && [ $# -eq 1 ]
	then
		node_modules/.bin/truffle test --verbose-rpc --network test_local
elif [ $1 == '--verbose-rpc' ] && [ $# -eq 2 ]
	then
		node_modules/.bin/truffle test --verbose-rpc $2 --network test_local
else
	node_modules/.bin/truffle test $1 --network test_local
fi

