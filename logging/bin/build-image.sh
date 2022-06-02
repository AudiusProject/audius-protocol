#!/usr/bin/env bash

set -e

API_CREDS=$(./bin/create-sp-es-api-keys.sh)
API_ID=$(echo ${API_CREDS} | jq -j .id | base64)
API_KEY=$(echo ${API_CREDS} | jq -j .api_key | base64)
. .env

FILEBEAT_VERSION=$(head -n1 filebeat/Dockerfile | cut -f 2 -d ':')
docker build \
        -t audius/filebeat:${FILEBEAT_VERSION} \
        --build-arg git_sha=$(git rev-parse HEAD) \
        --build-arg ELASTIC_ENDPOINT=${ELASTIC_ENDPOINT} \
        --build-arg ELASTIC_CLOUD_ID=${ELASTIC_CLOUD_ID} \
        --build-arg API_ID=${API_ID} \
        --build-arg API_KEY=${API_KEY} \
        filebeat

METRICBEAT_VERSION=$(head -n1 metricbeat/Dockerfile | cut -f 2 -d ':')
docker build \
        -t audius/metricbeat:${METRICBEAT_VERSION} \
        --build-arg git_sha=$(git rev-parse HEAD) \
        --build-arg ELASTIC_ENDPOINT=${ELASTIC_ENDPOINT} \
        --build-arg ELASTIC_CLOUD_ID=${ELASTIC_CLOUD_ID} \
        --build-arg API_ID=${API_ID} \
        --build-arg API_KEY=${API_KEY} \
        metricbeat

if [[ "${1}" == "push" ]]; then
    docker push audius/metricbeat:${METRICBEAT_VERSION}
    docker push audius/filebeat:${FILEBEAT_VERSION}
fi
