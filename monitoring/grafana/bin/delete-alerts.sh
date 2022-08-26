#!/usr/bin/env bash

set -e

# only accept the first argument in "manual" mode
GRAFANA_ALERTS_DIR="${1:-grafana/alerts/}"

: "${BEARER_PATH:=grafana/bearer.env}"
set -o allexport
source ${BEARER_PATH}
set +o allexport

: "${GRAFANA_USER:=admin}"
: "${GRAFANA_PASS:=admin}"
: "${GRAFANA_API_URL:=localhost}"
: "${GRAFANA_API_PORT:=80}"

BASE_URL=http://${GRAFANA_API_URL}:${GRAFANA_API_PORT}

json_alerts=$(find "${GRAFANA_ALERTS_DIR}" -name '*.json' -not -name 'alert.template.json')

# delete alert json files
for json_alert in ${json_alerts}
do
    echo "Removing all alerts for: ${json_alert}"
    echo -n "Press any key to continue..."
    read _

    cat ${json_alert} \
        | jq -cr '.[]' \
        | while read -r alert;
        do
            uid=$(echo ${alert} | jq -r .uid)
            echo "Updating: ${json_alert}:${uid}"

            curl \
                -s \
                -H "Authorization: Bearer ${BEARER_TOKEN}" \
                -u ${GRAFANA_USER}:${GRAFANA_PASS} \
                -X DELETE \
                -H "Content-Type: application/json" \
                -H "Accept: application/json" \
                -d "${alert}" \
                ${BASE_URL}/api/v1/provisioning/alert-rules/${uid} \
            | jq .
        done
done
