#!/bin/bash
set -e

cd audius-docker-compose/creator-node
git fetch
git checkout dev
git pull


docker compose pull mediorum
docker compose up -d mediorum --remove-orphans

