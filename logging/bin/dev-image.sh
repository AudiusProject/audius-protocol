#!/usr/bin/env bash

# useful for testing changes to filebeat.yml

set -e

# the only way to consume a change, currently, is to bake and push an image
./bin/build-image.sh push

A run logging down
A run logging up

# create indexes using the new index version
./bin/create-data-view.sh

docker-compose logs -f
