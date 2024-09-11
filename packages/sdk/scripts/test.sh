#!/usr/bin/env bash

set -e
set -o xtrace

##### INIT DATA CONTRACTS #####

if [ -d "../../contracts" ]
then
  echo "Audius contracts repo is present"
  cd ../../contracts/
else
  echo "INCORRECT REPOSITORY STRUCTURE. PLEASE FOLLOW README"
  exit 1
fi

rm -rf ./build/

# not problematic for this to fail
set +e
npm run ganache-q
set -e

npm run ganache
npm run truffle-migrate


##### INIT ETH CONTRACTS #####

if [ -d "../../eth-contracts" ]
then
  echo "Audius eth-contracts repo is present"
  cd ../../eth-contracts/
else
  echo "INCORRECT REPOSITORY STRUCTURE. PLEASE FOLLOW README"
  exit 1
fi

rm -rf ./build/

# not problematic for this to fail
set +e
npm run ganache-q
set -e

npm run ganache
npm run truffle-migrate


#### RUN TESTS #####

cd ../packages/libs/

# Migrate data & eth contracts
# - Copy contracts build dir + create config files
# - Data contracts config: registry contract & owner wallet addresses
# - Eth contracts config: AudiusToken contract, registry contract and owner wallet addresses
sh ./scripts/migrate_contracts.sh

# Run unit tests
npm run test:unit

# run tests
printf '\nSTART tests:\n\n'
if [ "$#" -eq  "0" ]
 then
  ./node_modules/.bin/nyc --include src ./node_modules/.bin/mocha tests/index.js
else
  ./node_modules/.bin/nyc --include src ./node_modules/.bin/mocha $1
fi

# run linter
node_modules/.bin/standard

# intentionally does not bring down containers
