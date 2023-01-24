#!/bin/bash
set -e

cd audius-docker-compose/discovery-provider
git fetch
git checkout comms
git reset --hard origin/comms

audius-cli launch discovery-provider -y
