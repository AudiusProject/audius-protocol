#!/bin/bash
set -e

cd audius-docker-compose
git checkout comms
git pull

audius-cli launch creator-node -y
