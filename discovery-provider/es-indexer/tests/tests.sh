#!/usr/bin/env bash

set -e

export NODE_ENV=test
export audius_db_url=postgres://postgres:postgres@localhost:5466/postgres 
export audius_elasticsearch_url=http://localhost:9266 
./node_modules/.bin/ts-node tests/fixtures.ts

npm test
