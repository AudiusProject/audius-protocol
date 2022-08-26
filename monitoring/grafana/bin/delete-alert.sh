#!/usr/bin/env bash

set -e

# only accept a single UID at a time
UID=${1}

: "${BEARER_PATH:=grafana/bearer.env}"
set -o allexport
source ${BEARER_PATH}
set +o allexport

: "${GRAFANA_USER:=admin}"
: "${GRAFANA_PASS:=admin}"
: "${GRAFANA_API_URL:=localhost}"
: "${GRAFANA_API_PORT:=80}"

BASE_URL=http://${GRAFANA_API_URL}:${GRAFANA_API_PORT}

# delete alert by UID
curl \
    -s \
    -H "Authorization: Bearer ${BEARER_TOKEN}" \
    -u ${GRAFANA_USER}:${GRAFANA_PASS} \
    -X DELETE \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -d "${alert}" \
    ${BASE_URL}/api/v1/provisioning/alert-rules/${UID} \
| jq .