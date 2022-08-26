#!/usr/bin/env bash

# crontab:
# 0 0 * * * cd ~/audius-protocol/monitoring && scripts/deploy.sh prod

set -ex

PROM_ENV="${1:-local}"

docker-compose build --build-arg PROM_ENV=${PROM_ENV}

docker-compose down
docker network create audius_dev || true
docker-compose up -d
