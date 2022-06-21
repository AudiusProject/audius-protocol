#!/usr/bin/env bash

set -ex

PROM_ENV="${1:-local}"

docker-compose build --build-arg PROM_ENV=${PROM_ENV}

docker-compose down
docker-compose up -d
