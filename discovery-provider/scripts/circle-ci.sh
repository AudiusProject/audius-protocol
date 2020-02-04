#!/bin/bash
source ./scripts/utilities.sh

function main {
  set -e
  export audius_ipfs_port=5001
  export audius_redis_url=redis://localhost:6379/0
  source venv/bin/activate
  cd_contracts_repo
  echo 'Migrating contracts'
  node_modules/.bin/truffle migrate
  echo 'Writing flask config'
  node_modules/.bin/truffle exec scripts/_contractsLocalSetup.js -run
  cd_discprov_repo
  pytest -s -v --fulltrace
}

main 
