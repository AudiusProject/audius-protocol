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

folders=grafana/dashboards/folders.json
cat ${folders} \
    | jq -cr '.[]' \
    | while read -r folder;
    do
        echo "Updating: ${folder}"

        # ignore stdout since it really only gets run on setup
        # mainly needed for Alerts (Production only)
        curl \
            -s \
            -H "Authorization: Bearer ${BEARER_TOKEN}" \
            -u ${GRAFANA_USER}:${GRAFANA_PASS} \
            -X POST \
            -H "Content-Type: application/json" \
            -H "Accept: application/json" \
            -d "${folder}" \
            ${BASE_URL}/api/folders \
        | jq . \
            > /dev/null
    done

# upload dashboard json files
json_dashboards=$(find "${GRAFANA_DASHBOARD_DIR}" -name '*.json' -not -name 'library.json' -not -name 'folders.json')
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
