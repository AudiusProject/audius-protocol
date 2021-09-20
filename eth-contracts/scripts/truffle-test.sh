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
if docker ps | grep 'audius_ganache_cli_eth_contracts_test' > /dev/null; then
	# killing the container seems to be faster than restarting
	printf 'Remove old containers and build artifacts\n'
	docker rm -f audius_ganache_cli_eth_contracts_test
	rm -rf ./build/
	printf '\n'
fi

rm -rf ./build/
docker rm -f audius_ganache_cli_eth_contracts_test

# echo commands from here out
# useful to know what the test script is actually doing
set -x
# Ganache parameters
# -h = hostname
# -l = gas limit on block
# -a = number of accounts to generate on startup
docker run --name audius_ganache_cli_eth_contracts_test -d -p 8556:8545 trufflesuite/ganache-cli:v6.12.2 -h 0.0.0.0 -l 8000000 -a 500 -k istanbul

# compile
./node_modules/.bin/truffle compile

# run truffle tests
if [ $# -eq 0 ]
	then
		node_modules/.bin/truffle test test/*.test.js --network=test_local
		# node_modules/.bin/truffle test test/claimsManager.test.js test/delegateManager.test.js test/governance.test.js --network=test_local
elif [ $1 == '--audius-random' ] && [ $# -eq 1 ]
	then
		node_modules/.bin/truffle test test/random/random.test.js --network=test_local
elif [ $1 == '--verbose-rpc' ] && [ $# -eq 1 ]
	then
		node_modules/.bin/truffle test test/*.js --network=test_local --verbose-rpc
elif [ $1 == '--verbose-rpc' ] && [ $# -eq 2 ]
	then
		node_modules/.bin/truffle test test/*.js --network=test_local --verbose-rpc $2
else
	node_modules/.bin/truffle test test/*.js --network=test_local $1
fi

# tear down
# docker rm -f audius_ganache_cli_eth_contracts_test
# rm -rf ./build/
