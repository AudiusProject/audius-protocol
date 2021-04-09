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
export redisHost='localhost'
export redisPort='6379'
export dbUrl="postgres://postgres:postgres@localhost:$PG_PORT/audius_identity_service_test"
export logLevel='debug' #should be error
export solanaCreateAndVerifyAddress=''
export solanaProgramAddress=''
export solanaValidSigner=''

# Locally, the docker-compose files set up a database named audius_identity_service. For
# tests, we use audius_identity_service_test. The below block checks if
# audius_identity_service_test exists, and if not, creates it (the tests will fail if this
# database does not exist). If psql is not installed (ex. in CircleCI), this command will
# fail, so we check if it is installed first.
# In CircleCI, the docker environment variables set up audius_identity_service_test instead of
# audius_identity_service.

# CircleCI job and docker run in separate environments and cannot directly communicate with each other.
# Therefore the 'docker exec' command will not work when running the CI build.
# https://circleci.com/docs/2.0/building-docker-images/#separation-of-environments
# So, if tests are run locally, run docker exec command. Else, run the psql command in the job.
if [ -z "${isCIBuild}" ]; then
  # taken from https://stackoverflow.com/a/36591842
  docker exec -i audius-identity-service_identity-db_1 /bin/sh -c "psql -U postgres -tc \"SELECT 1 FROM pg_database WHERE datname = 'audius_identity_service_test'\" | grep -q 1 || psql -U postgres -c \"CREATE DATABASE audius_identity_service_test\""
elif [ -x "$(command -v psql)" ]; then
  psql -U postgres -h localhost -p $PG_PORT -tc "SELECT 1 FROM pg_database WHERE datname = 'audius_identity_service_test'" | grep -q 1 || psql -U postgres -h localhost -p $PG_PORT -c "CREATE DATABASE audius_identity_service_test"
fi

# tests
./node_modules/mocha/bin/mocha test/index.js --timeout 10000 --exit

# linter

npm run lint
