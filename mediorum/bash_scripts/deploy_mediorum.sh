#!/bin/bash
set -e

# docker system prune -a --force

cd audius-docker-compose/creator-node
git fetch
git checkout mediorum_tag_2
git pull

FILE='/home/ubuntu/audius-docker-compose/creator-node/.env'

sed -i '/COMMS_TAG.*$/d' .env

LINE="MEDIORUM_PORT='4000'"
grep -qF -- "$LINE" "$FILE" || echo "$LINE" >> "$FILE"

LINE="BACKEND_PORT='4001'"
grep -qF -- "$LINE" "$FILE" || echo "$LINE" >> "$FILE"

LINE="MEDIORUM_TAG='latest'"
grep -qF -- "$LINE" "$FILE" || echo "$LINE" >> "$FILE"

docker compose pull mediorum
docker compose up -d
# docker compose up -d mediorum --remove-orphans

