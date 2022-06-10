#!/usr/bin/env bash

set -ex

git pull
docker-compose build

docker-compose down
docker-compose up -d
