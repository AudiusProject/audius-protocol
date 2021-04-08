#!/bin/bash
source ./scripts/utilities.sh

function main {
  set -e
  source venv/bin/activate
  cd_contracts_repo
  echo 'Migrating contracts'
  node_modules/.bin/truffle migrate --network test_local
  echo 'Writing flask config'
  node_modules/.bin/truffle exec scripts/_contractsLocalSetup.js -run --network test_local
  cd_discprov_repo

  # run migrations
  export PYTHONPATH='.'
  alembic upgrade head

  pytest -s -v --fulltrace
}

main
