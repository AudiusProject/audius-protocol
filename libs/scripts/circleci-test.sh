#!/usr/bin/env bash

<<COMMENT
CircleCI Specific Test Script
Removes dependency on docker container, assumes ports 8545 & 8546 are exposed
COMMENT

##### INIT DATA CONTRACTS #####

if [ -d "../contracts" ]
then
  echo "Audius contracts repo is present"
  cd ../contracts/
else
  echo "INCORRECT REPOSITORY STRUCTURE. PLEASE FOLLOW README"
  exit 1
fi

rm -rf ./build/
npm run truffle-migrate

##### INIT ETH CONTRACTS #####

if [ -d "../eth-contracts" ]
then
  echo "Audius eth-contracts repo is present"
  cd ../eth-contracts/
else
  echo "INCORRECT REPOSITORY STRUCTURE. PLEASE FOLLOW README"
  exit 1
fi

rm -rf ./build/
npm run truffle-migrate

#### RUN TESTS #####

cd ../libs/

# Run unit tests
npm run test:units

# Migrate data & eth contracts
# - Copy contracts build dir + create config files
# - Data contracts config: registry contract & owner wallet addresses
# - Eth contracts config: AudiusToken contract address
sh ./scripts/migrate_contracts.sh

set -e

# run tests
printf '\nSTART tests:\n\n'
node_modules/.bin/mocha tests/index.js

# run linter
node_modules/.bin/standard