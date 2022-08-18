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


# upload all library panels
cat grafana/dashboards/library.json \
    | jq -cr '.[]' \
    | while read -r panel;
    do
        response=$(curl \
            -s \
            -H "Authorization: Bearer ${BEARER_TOKEN}" \
            -u ${GRAFANA_USER}:${GRAFANA_PASS} \
            -X POST \
            -H "Content-Type: application/json" \
            -H "Accept: application/json" \
            -d "${panel}" \
            ${BASE_URL}/api/library-elements)
        message=$(echo ${response} | jq -r '.message // empty')
        if [[ "${message}" =~ .*"library element with that name or UID already exists".* ]]; then
            echo "Found: $(echo ${panel} | jq -r .uid)"
        else
            echo "Created: $(echo ${panel} | jq -r .uid)"
            echo ${response} | jq .
        fi
     done

cat grafana/dashboards/library.json \
    | jq -cr '.[]' \
    | while read -r panel;
    do
        uid=$(echo ${panel} | jq -r .uid)
        curl \
            -s \
            -H "Authorization: Bearer ${BEARER_TOKEN}" \
            -u ${GRAFANA_USER}:${GRAFANA_PASS} \
            -X PATCH \
            -H "Content-Type: application/json" \
            -H "Accept: application/json" \
            -d "${panel}" \
            ${BASE_URL}/api/library-elements/${uid} \
            | jq .
     done
echo "Uploaded library panels."
