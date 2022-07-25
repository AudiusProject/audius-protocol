#!/usr/bin/env bash

set -e

# only accept the first argument in "manual" mode
GRAFANA_DASHBOARD_DIR="${1:-grafana/dashboards/}"

: "${BEARER_PATH:=grafana/bearer.env}"
set -o allexport
source ${BEARER_PATH}
set +o allexport

: "${GRAFANA_USER:=admin}"
: "${GRAFANA_PASS:=admin}"
: "${GRAFANA_API_URL:=localhost}"
: "${GRAFANA_API_PORT:=80}"

BASE_URL=http://${GRAFANA_API_URL}:${GRAFANA_API_PORT}


json_dashboards=$(find "${GRAFANA_DASHBOARD_DIR}" -name '*.json')
for json_dashboard in ${json_dashboards}
do
    curl \
        -s \
        -H "Authorization: Bearer ${BEARER_TOKEN}" \
        -u ${GRAFANA_USER}:${GRAFANA_PASS} \
        -X POST \
        -H "Content-Type: application/json" \
        -H "Accept: application/json" \
        -d "@${json_dashboard}" \
        ${BASE_URL}/api/dashboards/import \
    | jq .
    echo "Uploaded: ${json_dashboard}"
done
