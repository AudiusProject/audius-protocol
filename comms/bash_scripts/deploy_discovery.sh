#!/bin/bash
set -e

cd audius-docker-compose/discovery-provider
git checkout main
git pull

audius-cli set-tag -y --comms "$(git rev-parse HEAD)"

docker compose pull nats comms
docker compose up -d nats comms
