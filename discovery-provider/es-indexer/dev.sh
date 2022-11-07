#!/usr/bin/env bash

set -e

docker compose up -d
export NODE_ENV=dev
export audius_db_url=postgres://postgres:postgres@localhost:5466/postgres 
export audius_elasticsearch_url=http://localhost:9266 


npm run build
npm start
