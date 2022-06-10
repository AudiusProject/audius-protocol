#!/usr/bin/env bash

set -ex

git checkout master
git pull
docker-compose build

docker-compose down
docker-compose up -d
