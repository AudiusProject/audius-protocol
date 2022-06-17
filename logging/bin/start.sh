#!/usr/bin/env bash

cd ${PROTOCOL_DIR}/logging

docker-compose pull
# export HOSTNAME=$(hostname)
docker-compose up -d
