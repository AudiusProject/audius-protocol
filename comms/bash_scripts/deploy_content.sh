#!/bin/bash
set -e

cd audius-docker-compose
git checkout main
git pull

LINE="COMMS_TAG='a1'"
FILE='/home/ubuntu/audius-docker-compose/creator-node/.env'
grep -qF -- "$LINE" "$FILE" || echo "$LINE" >> "$FILE"

audius-cli launch creator-node -y
