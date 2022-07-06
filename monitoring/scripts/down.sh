#!/usr/bin/env bash

set -ex

docker-compose down

sudo rm -rf ./data/grafana
rm -f ./grafana/bearer.env
