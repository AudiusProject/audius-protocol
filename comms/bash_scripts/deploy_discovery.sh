#!/bin/bash
set -e

cd audius-docker-compose/discovery-provider
git checkout main
git pull

sed -i '/COMMS_TAG.*$/d' .env
LINE="COMMS_TAG='a1'"
FILE='/home/ubuntu/audius-docker-compose/discovery-provider/.env'
grep -qF -- "$LINE" "$FILE" || echo "$LINE" >> "$FILE"

docker compose pull nats comms
docker compose up -d nats comms
