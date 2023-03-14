#!/bin/bash

set -e

cd audius-docker-compose/creator-node
git checkout main
git pull

audius-cli set-tag -y --comms "$1"

docker compose pull nats storage
docker compose up -d --force-recreate nats storage
