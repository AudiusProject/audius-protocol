#!/bin/bash
set -e

cd audius-docker-compose/discovery-provider
git checkout main
git pull

audius-cli launch discovery-provider -y
