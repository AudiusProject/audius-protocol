#!/bin/bash
set -e

cd audius-docker-compose/discovery-provider
git checkout main
git pull

LINE="COMMS_TAG='a1'"
FILE='/home/ubuntu/audius-docker-compose/discovery-provider/.env'
grep -qF -- "$LINE" "$FILE" || echo "$LINE" >> "$FILE"

audius-cli launch discovery-provider -y
