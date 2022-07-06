#!/usr/bin/env bash

set -ex

docker-compose down

# include if you want to start with a clean slate
# sudo rm -rf ./data/

rm -f ./grafana/bearer.env
