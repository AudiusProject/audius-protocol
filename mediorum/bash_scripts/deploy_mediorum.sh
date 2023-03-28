#!/bin/bash
set -e

cd audius-docker-compose/creator-node
git fetch
git checkout main
git pull


docker compose pull mediorum
docker compose up -d mediorum --remove-orphans

