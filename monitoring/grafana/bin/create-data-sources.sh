#!/usr/bin/env bash

set -e

: "${BEARER_PATH:=grafana/bearer.env}"
touch ${BEARER_PATH}
set -o allexport
source ${BEARER_PATH}
set +o allexport

: "${GRAFANA_USER:=admin}"
: "${GRAFANA_PASS:=admin}"
: "${GRAFANA_API_URL:=localhost}"
: "${GRAFANA_API_PORT:=80}"
: "${GRAFANA_ORG:=audius}"

BASE_URL=http://${GRAFANA_USER}:${GRAFANA_PASS}@${GRAFANA_API_URL}:${GRAFANA_API_PORT}

# wait for API to be live before creating the bearer token
until curl -s -f -o /dev/null ${BASE_URL}/api/orgs
do
  sleep 1
done

if [[ -z "${BEARER_TOKEN}" ]]; then
    curl -s \
        -X POST \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"${GRAFANA_ORG}\"}" \
        ${BASE_URL}/api/orgs

    ORG_ID=$(curl -s \
        -H 'Content-Type: application/json' \
        ${BASE_URL}/api/orgs \
        | jq '.[] | select(.name == "${GRAFANA_ORG}") | .id')

    curl -s \
        -X POST \
        -H "Content-Type: application/json" \
        -d '{"loginOrEmail":"${GRAFANA_USER}", "role": "Admin"}' \
        ${BASE_URL}/api/orgs/${ORG_ID}/users

    curl -s \
        -X POST \
        ${BASE_URL}/api/user/using/${ORG_ID}

    BEARER_TOKEN=$(curl -s \
        -X POST \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"${GRAFANA_ORG}-$(date +%s)\", \"role\": \"Admin\"}" \
        ${BASE_URL}/api/auth/keys \
        | jq -r '.key')

    echo "BEARER_TOKEN=${BEARER_TOKEN}" > ${BEARER_PATH}
fi

while :
do
	curl \
        -s \
        -X POST \
        -H "Authorization: Bearer ${BEARER_TOKEN}" \
        -H 'Content-Type: application/json' \
        --data-binary '{
            "name":"prometheus",
            "type":"prometheus",
            "uid":"r2_nnDL7z",
            "isDefault":true,
            "url":"http://prometheus:9090",
            "access":"proxy"}' \
        ${BASE_URL}/api/datasources \
        && break
    sleep 1
done
