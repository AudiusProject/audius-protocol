#!/bin/bash
set -e

cd audius-docker-compose/creator-node
git checkout main
git pull

sed -i '/COMMS_TAG.*$/d' .env
LINE="COMMS_TAG='a1'"
FILE='/home/ubuntu/audius-docker-compose/creator-node/.env'
grep -qF -- "$LINE" "$FILE" || echo "$LINE" >> "$FILE"

docker compose pull nats storage
docker compose up -d nats storage

# audius-cli launch creator-node -y
