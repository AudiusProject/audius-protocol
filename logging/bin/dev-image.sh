#!/usr/bin/env bash

# useful for testing changes to filebeat.yml

set -e

./bin/build-image.sh

docker-compose down
docker-compose up -d

# create indexes using the new index version
./bin/create-data-view.sh

docker-compose logs -f
