#!/usr/bin/env bash

set -ex

docker-compose down

sudo rm -rf ./data
rm -f ./grafana/bearer.env
