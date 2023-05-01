#!/bin/bash

set -e

cd audius-docker-compose/discovery-provider
git checkout dev
git pull

audius-cli set-tag -y --comms "$1"

docker compose pull comms
docker compose up -d comms
