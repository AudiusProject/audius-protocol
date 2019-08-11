#!/usr/bin/env bash

set -o xtrace
set -e

PG_PORT=$POSTGRES_TEST_PORT
if [ -z "${PG_PORT}" ]; then
  PG_PORT=8432
fi

export dbUrl="postgres://postgres:postgres@localhost:$PG_PORT/audius_content_service_test"
export storagePath='./test_file_storage'
export logLevel='error'

# Locally, the docker-compose files set up a database named audius_content_service. For
# tests, we use audius_content_service_test. The below block checks if
# audius_content_service_test exists, and if not, creates it (the tests will fail if this
# database does not exist). If psql is not installed (ex. in CircleCI), this command will
# fail, so we check if it is installed first.
# In CircleCI, the docker environment variables set up audius_content_service_test instead of
# audius_content_service.
if [ -x "$(command -v psql)" ]; then
  # taken from https://stackoverflow.com/a/36591842
  psql -U postgres -h localhost -p $PG_PORT -tc "SELECT 1 FROM pg_database WHERE datname = 'audius_content_service_test'" | grep -q 1 || psql -U postgres -h localhost -p $PG_PORT -c "CREATE DATABASE audius_content_service_test"
fi

mkdir -p $storagePath

# linter
./node_modules/.bin/standard

# tests
./node_modules/mocha/bin/mocha --exit

rm -r $storagePath
