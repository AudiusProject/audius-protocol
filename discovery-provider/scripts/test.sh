#!/bin/bash

# Audius Discovery Provider / Test
# Runs configured unit test scripts
# NOTE - the ipfs compose files have been moved from discprov to libs.
#   Before running this test locally, bring up ipfs pod with libs/scripts/ipfs.sh


source ./scripts/utilities.sh

function cd_contracts_repo {
  # Navigate to contracts repository
  if [ -d "../contracts" ]
  then
    echo "Audius contracts repo is present"
    cd ../contracts/
  else
    echo "INCORRECT REPOSITORY STRUCTURE. PLEASE FOLLOW README"
    exit 1
  fi
}

function cd_discprov_repo {
  # Navigate to discovery provider repository
  if [ -d "../discovery-provider" ]
  then
    echo "Audius discprov repo is present"
    cd ../discovery-provider/
  else
    echo "INCORRECT REPOSITORY STRUCTURE. PLEASE FOLLOW README"
    exit 1
  fi
}

if [ ! -f .gitignore ]; then
    echo "Run test script from audius discovery provider root"
    exit
fi

set -e
python3 scripts/lint.py

# initialize virtual environment
# rm -r venv
# python3 -m venv venv
# source venv/bin/activate
pip3 install -r requirements.txt
sleep 5
set +e

# Reset local blockchain for deterministic test results
cd_contracts_repo
npm run ganache-q
npm run ganache
sleep 5

node_modules/.bin/truffle migrate
node_modules/.bin/truffle exec scripts/_contractsLocalSetup.js -run
cd_discprov_repo

# Stop dependencies, if present
docker-compose -f docker-compose.base.yml stop
docker-compose -f docker-compose.base.yml rm -f
# docker-compose -f docker-compose.ipfs.yml stop
# docker-compose -f docker-compose.ipfs.yml rm -f

# Bring up local dependencies - postgres, redis, ipfs
docker-compose -f docker-compose.base.yml up -d
# docker-compose -f docker-compose.ipfs.yml up -d
sleep 5

# Unit tests
pytest src

# Integration tests
pytest tests
