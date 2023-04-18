#!/bin/bash
set -e

cd audius-docker-compose/creator-node
git fetch
git checkout mediorum-proxy
git pull


docker compose pull mediorum
docker compose up -d
# docker compose up -d mediorum --remove-orphans

