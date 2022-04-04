#!/usr/bin/env bash

<<COMMENT
EXAMPLE SCENARIOS
	truffle test
	truffle test [path]
	truffle test --verbose-rpc
	truffle test --verbose-rpc [path]
COMMENT

# set up

# start ganache container,
# kill old container instance if tear down did not complete
if docker ps | grep 'audius_ganache_cli_test' > /dev/null; then
	# killing the container seems to be faster than restarting
	printf 'Remove old containers and build artifacts\n'
	docker rm -f audius_ganache_cli_test
	rm -rf ./build/
	printf '\n'
fi

# echo commands from here out
# useful to know what the test script is actually doing
set -x

docker run --name audius_ganache_cli_test -d -p 8555:8545 trufflesuite/ganache-cli:latest -h 0.0.0.0 -l 8000000 -a 50

# compile and lint
./node_modules/.bin/truffle compile
./scripts/lint.sh

# run truffle tests
if [ $# -eq 0 ]
	then
		node_modules/.bin/truffle test --network=test_local
elif [ $1 == '--verbose-rpc' ] && [ $# -eq 1 ]
	then
		node_modules/.bin/truffle test --network=test_local --verbose-rpc
elif [ $1 == '--verbose-rpc' ] && [ $# -eq 2 ]
	then
		node_modules/.bin/truffle test --network=test_local --verbose-rpc $2
else
	node_modules/.bin/truffle test --network=test_local $1
fi

# tear down
# docker rm -f audius_ganache_cli_test
# rm -rf ./build/
