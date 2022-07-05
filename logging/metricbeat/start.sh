#!/usr/bin/env bash

set -ex

ELASTIC_ENDPOINT=$(echo ${ELASTIC_ENDPOINT} | base64 -d)
ELASTIC_CLOUD_ID=$(echo ${ELASTIC_CLOUD_ID} | base64 -d)
API_ID=$(echo ${API_ID} | base64 -d)
API_KEY=$(echo ${API_KEY} | base64 -d)

/usr/local/bin/docker-entrypoint \
    -E output.elasticsearch.hosts=["${ELASTIC_ENDPOINT}"] \
    -E cloud.id="${ELASTIC_CLOUD_ID}" \
    -E cloud.auth="${API_ID}:${API_KEY}"
