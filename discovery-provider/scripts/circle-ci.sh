#!/bin/bash
source ./scripts/utilities.sh

function main {
  set -e
  source venv/bin/activate

  # run contract migrations
  cd_contracts_repo
  echo 'Migrating contracts'
  node_modules/.bin/truffle migrate --network test_local
  echo 'Writing flask config'
  node_modules/.bin/truffle exec scripts/_contractsLocalSetup.js -run --network test_local

  # run eth-contracts migrations
  cd_eth_contracts_repo
  echo 'Migrating eth-contracts'
  node_modules/.bin/truffle migrate --network test_local
  audius_eth_contracts_registry=$(node -p "require('./migrations/migration-output.json').registryAddress")

  # run database migrations
  cd_discprov_repo
  echo 'Running alembic migrations'
  export PYTHONPATH='.'
  alembic upgrade head
  echo 'Finished running migrations'

  pytest -s -v --fulltrace
}

main
