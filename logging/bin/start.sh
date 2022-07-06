#!/usr/bin/env bash

cd ${PROTOCOL_DIR}/logging

docker-compose pull
docker-compose up -d
