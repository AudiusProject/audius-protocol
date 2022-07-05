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

PASS_URL=http://${GRAFANA_USER}:${GRAFANA_PASS}@${GRAFANA_API_URL}:${GRAFANA_API_PORT}
BASE_URL=http://${GRAFANA_API_URL}:${GRAFANA_API_PORT}

# REMOVE METADATA
# filter out environment-sensitive keys
CLEAR_METADATA='.dashboard'
CLEAR_ITERATION='del(.iteration)'

# CLEAR VERSION TO AVOID CONFLICTS
# reset .versions to null
CLEAR_VERSION='.version = null'
CLEAR_DASHBOARD_ID='.id = null'

# CLEAR PROMETHEUS UID
# clears prometheus uid since each deployment is unique
CLEAR_PROM_UID='del(.panels[].targets[]?.datasource.uid)'

# RESET TIME WINDOW AND REFRESH TIMES
# restrict time windows to avoid Prometheus pressure
SET_TIME_WINDOW_FROM='.time.from = "now-2h"'
SET_TIME_WINDOW_TO='.time.to = "now"'
# restrict auto-refresh time to avoid Prometheus pressure
SET_REFRESH_INTERVAL='.refresh = "30m"'
# set a time delay since graphs don't fall sharply down at the tail end
SET_TIME_DELAY='.timepicker.nowDelay = "1m"'

# clear prometheus id
CLEAR_DATASOURCE_ID='del(.templating.list[].datasource.uid)'

# RESET TEMPLATING
# clear current selection
RESET_TEMPLATE_SELECTION='del(.templating.list?[].current)'

# REQUIRED FOR PUSHING JSON-BACKED DASHBOARDS VIA THE API
# wrap the final output in a different format and use overwrite: true, to avoid .id and .version collisions
PUSH_FORMATTING='{dashboard: ., overwrite: true}'


for uid in $(curl -s ${PASS_URL}/api/search | jq -rc '.[] | select(.uri != "db/prometheus-stats") | select(.type != "dash-folder") | .uid')
do
    response=$(curl \
        -s \
        -H "Authorization: Bearer ${BEARER_TOKEN}" \
        -H 'Content-Type: application/json' \
        -H 'Accept: application/json' \
        ${BASE_URL}/api/dashboards/uid/${uid})

    # create local filepath using the .meta key
    slug=$(echo ${response} | jq -r '.meta.slug')
    path=grafana/dashboards
    mkdir -p "${path}"
    path=${path}/${slug}.json

    echo ${response} \
        | jq "${CLEAR_METADATA}" \
        | jq "${CLEAR_ITERATION}" \
        | jq "${CLEAR_VERSION}" \
        | jq "${CLEAR_DASHBOARD_ID}" \
        | jq "${CLEAR_PROM_UID}" \
        | jq "${SET_TIME_WINDOW_FROM}" \
        | jq "${SET_TIME_WINDOW_TO}" \
        | jq "${SET_REFRESH_INTERVAL}" \
        | jq "${SET_TIME_DELAY}" \
        | jq "${RESET_TEMPLATE_SELECTION}" \
        | jq "${CLEAR_DATASOURCE_ID}" \
        | jq "${PUSH_FORMATTING}" \
        > "${path}"
    echo "Saved to: ${path}"
done
