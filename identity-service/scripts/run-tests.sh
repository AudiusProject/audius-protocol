#!/usr/bin/env bash
set -o xtrace
set -e

PG_PORT=$POSTGRES_TEST_PORT
if [ -z "${PG_PORT}" ]; then
  PG_PORT=7432
fi
echo $PG_PORT

export ethTokenAddress=''
export ethRegistryAddress=''
export registryAddress=''
export ethOwnerWallet=''
export isTestRun=true
export dbUrl="postgres://postgres:postgres@localhost:$PG_PORT/audius_identity_service_test"
export logLevel='debug' #should be error

# Locally, the docker-compose files set up a database named audius_identity_service. For
# tests, we use audius_identity_service_test. The below block checks if
# audius_identity_service_test exists, and if not, creates it (the tests will fail if this
# database does not exist). If psql is not installed (ex. in CircleCI), this command will
# fail, so we check if it is installed first.
# In CircleCI, the docker environment variables set up audius_identity_service_test instead of
# audius_identity_service.
if [ -x "$(command -v psql)" ]; then
  # taken from https://stackoverflow.com/a/36591842
  psql -U postgres -h localhost -p $PG_PORT -tc "SELECT 1 FROM pg_database WHERE datname = 'audius_identity_service_test'" | grep -q 1 || psql -U postgres -h localhost -p $PG_PORT -c "CREATE DATABASE audius_identity_service_test"
fi

 # tests
./node_modules/mocha/bin/mocha test/index.js --timeout 10000 --exit

 # linter

npm run lint
