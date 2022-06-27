#!/usr/bin/env bash

set -e

: "${BEARER_PATH:=grafana/bearer.env}"
set -o allexport
source ${BEARER_PATH}
set +o allexport

: "${GRAFANA_USER:=admin}"
: "${GRAFANA_PASS:=admin}"
: "${GRAFANA_API_URL:=localhost}"
: "${GRAFANA_API_PORT:=80}"

BASE_URL=http://${GRAFANA_API_URL}:${GRAFANA_API_PORT}

: "${GRAFANA_DASHBOARD_DIR:=grafana/dashboards/}"

for json_dashboard in `ls -p ${GRAFANA_DASHBOARD_DIR} | grep -v /`
do
    curl \
        -s \
        -H "Authorization: Bearer ${BEARER_TOKEN}" \
        -u ${GRAFANA_USER}:${GRAFANA_PASS} \
        -X POST \
        -H "Content-Type: application/json" \
        -H "Accept: application/json" \
        -d "@${GRAFANA_DASHBOARD_DIR}${json_dashboard}" \
        ${BASE_URL}/api/dashboards/import \
    | jq .
    echo "Uploaded: ${json_dashboard}"
done
