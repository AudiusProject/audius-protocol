#!/bin/bash
set -e

cd audius-docker-compose
git checkout main
git pull

audius-cli launch creator-node -y
