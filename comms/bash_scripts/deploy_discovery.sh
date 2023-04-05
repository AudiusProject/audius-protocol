#!/bin/bash

set -e

cd audius-docker-compose/discovery-provider
git checkout main
git pull

audius-cli set-tag -y --comms "$1"

docker compose pull comms
# docker compose up -d --force-recreate nats comms
docker compose up -d --force-recreate comms
