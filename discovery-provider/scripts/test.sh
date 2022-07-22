#!/bin/bash

# Audius Discovery Provider / Test
# Runs configured unit test scripts
# NOTE - the ipfs compose files have been moved from discprov to libs.
#   Before running this test locally, bring up ipfs pod with libs/scripts/ipfs.sh

source ./scripts/utilities.sh

if [ ! -f .gitignore ]; then
  echo "Run test script from audius discovery provider root"
  exit
fi

set -e

# initialize virtual environment
# rm -r venv
# python3 -m venv venv
# source venv/bin/activate
pip3 install -r requirements.txt
sleep 5
set +e

cd es-indexer && npm i && cd -

if [ -n "${VERBOSE}" ]; then
  set -x
fi

# Reset local blockchain for deterministic test results
cd_contracts_repo
npm run ganache-q
npm run ganache
sleep 5
node_modules/.bin/truffle migrate
node_modules/.bin/truffle exec scripts/migrate-contracts.js

cd_eth_contracts_repo
npm run ganache-q
npm run ganache
sleep 5
node_modules/.bin/truffle migrate
node_modules/.bin/truffle exec scripts/migrate-contracts.js

cd_discprov_repo

# Stop dependencies, if present
docker network rm audius_dev
docker-compose \
  -f compose/docker-compose.db.yml \
  -f compose/docker-compose.redis.yml \
  -f compose/docker-compose.elasticsearch.yml \
  -f compose/docker-compose.ipfs.yml \
  --env-file compose/.test.env \
  stop

docker-compose \
  -f compose/docker-compose.db.yml \
  -f compose/docker-compose.redis.yml \
  -f compose/docker-compose.elasticsearch.yml \
  -f compose/docker-compose.ipfs.yml \
  --env-file compose/.test.env \
  rm -rf

# Bring up local dependencies - postgres, redis, ipfs
docker network create audius_dev
docker-compose \
  -f compose/docker-compose.db.yml \
  -f compose/docker-compose.redis.yml \
  -f compose/docker-compose.elasticsearch.yml \
  -f compose/docker-compose.ipfs.yml \
  --env-file compose/.test.env \
  up -d

sleep 5

if [ -z ${SKIP_TESTS+x} ]; then
  # Unit tests
  pytest src

  export PROMETHEUS_MULTIPROC_DIR=./prometheus_data
  mkdir -p $PROMETHEUS_MULTIPROC_DIR

  # Integration tests
  pytest integration_tests
fi
