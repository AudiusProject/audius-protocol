#! /bin/bash
set -e

# start postgres + elasticsearch
docker compose up -d

# set env variables
export audius_db_url='postgres://postgres:testing@localhost:35764'
export audius_elasticsearch_url='http://localhost:35765'
export DB_URL="$audius_db_url"

# run pg_migrate
# cd ../discovery-provider/ddl && ./pg_migrate.sh && cd - || exit
docker exec -w '/ddl' trpc-server-db-1 './pg_migrate.sh'

# populate db fixtures
npx vite-node test/_fixtures.ts

# run es-indexer
cd ../es-indexer && npm run catchup:ci && cd - || exit

# run tests
npx vitest "$1"
