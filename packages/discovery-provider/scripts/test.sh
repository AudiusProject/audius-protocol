#!/bin/bash

# Audius Discovery Provider / Test
# Runs configured unit test scripts

source ./scripts/utilities.sh
source .test.env

if [ ! -f .gitignore ]; then
  echo "Run test script from audius discovery provider root"
  exit
fi

set -e

# initialize virtual environment
# rm -r venv
# python3 -m venv venv
# source venv/bin/activate
python3.9 -m pip install -r requirements.txt
sleep 5
set +e

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
docker compose \
  -f compose/docker-compose.db.yml \
  -f compose/docker-compose.redis.yml \
  -f compose/docker-compose.elasticsearch.yml \
  --env-file compose/.test.env \
  stop

docker compose \
  -f compose/docker-compose.db.yml \
  -f compose/docker-compose.redis.yml \
  -f compose/docker-compose.elasticsearch.yml \
  --env-file compose/.test.env \
  rm -rf

# Bring up local dependencies - postgres, redis
docker network create audius_dev
docker compose \
  -f compose/docker-compose.db.yml \
  -f compose/docker-compose.redis.yml \
  -f compose/docker-compose.elasticsearch.yml \
  --env-file compose/.test.env \
  up -d

# Create prometheus data test dir which is defined
# for tests in the pytest.ini file
mkdir -p "$PROMETHEUS_MULTIPROC_DIR"

if [ -z ${SKIP_TESTS+x} ]; then
  # Unit tests
  python3.9 -m pytest src

  # Integration tests
  python3.9 -m pytest integration_tests
fi
