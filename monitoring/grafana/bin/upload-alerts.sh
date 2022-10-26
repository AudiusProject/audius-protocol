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

json_alerts=$(find "${GRAFANA_ALERTS_DIR}" -name '*.json')

# attempt to create alerts, in case they doesn't exist
for json_alert in ${json_alerts}
do
    cat ${json_alert} \
        | jq -cr '.[]' \
        | while read -r alert;
        do
            uid=$(echo ${alert} | jq -r .uid)

            response=$(curl \
                -s \
                -H "Authorization: Bearer ${BEARER_TOKEN}" \
                -u ${GRAFANA_USER}:${GRAFANA_PASS} \
                -X POST \
                -H "Content-Type: application/json" \
                -H "Accept: application/json" \
                -d "${alert}" \
                ${BASE_URL}/api/v1/provisioning/alert-rules)
            message=$(echo ${response} | jq -r '.message // empty')
            if [[ "${message}" =~ .*"UNIQUE constraint failed: alert_rule.id".* ]]; then
                echo "Found: ${json_alert}:${uid}"
            else
                echo "Created: ${json_alert}:${uid}"
                echo ${response} | jq .
            fi
        done
done

# update all alerts, matching on uid and id
for json_alert in ${json_alerts}
do
    cat ${json_alert} \
        | jq -cr '.[]' \
        | while read -r alert;
        do
            uid=$(echo ${alert} | jq -r .uid)
            echo "Updating: ${json_alert}:${uid}"

            response=$(curl \
                -s \
                -H "Authorization: Bearer ${BEARER_TOKEN}" \
                -u ${GRAFANA_USER}:${GRAFANA_PASS} \
                -X PUT \
                -H "Content-Type: application/json" \
                -H "Accept: application/json" \
                -d "${alert}" \
                ${BASE_URL}/api/v1/provisioning/alert-rules/${uid})

            message=$(echo ${response} | jq -r '.message // empty')
            if [[ -n "${message}" ]]; then
                echo ${json_alert}
                echo ${response} | jq .
            fi
        done
done
