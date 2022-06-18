#!/usr/bin/env bash

set -e

./bin/build-image.sh push

A run logging down
A run logging up
./bin/create-data-view.sh

docker-compose logs -f
