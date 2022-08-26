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
: "${CLEAR_DASHBOARD_ID:=.id = null}"

# CLEAR PROMETHEUS UID
# clears prometheus uid since each deployment is unique
CLEAR_PROM_TARGET_UID='del(.panels[].targets[]?.datasource.uid)'
CLEAR_PROM_PANEL_UID='del(.panels[].datasource)'

# RESET TIME WINDOW AND REFRESH TIMES
# restrict time windows to avoid Prometheus pressure
SET_TIME_WINDOW_FROM='.time.from = "now-2h"'
SET_TIME_WINDOW_TO='.time.to = "now"'
# restrict auto-refresh time to avoid Prometheus pressure
SET_REFRESH_INTERVAL='.refresh = "30m"'
# set a time delay since graphs don't fall sharply down at the tail end
SET_TIME_DELAY='.timepicker.nowDelay = "1m"'

# RESET TEMPLATING
# clear current selection
RESET_TEMPLATE_SELECTION='del(.templating.list?[].current)'

# SANITIZE LIBRARY PANELS
# when a panel is a library panel, only keep the libraryPanel and gridPos keys
# since everything else is ignored at upload time
# also trim the created/updated fields since they generate plenty of commit noise
SANITIZE_LIBRARY_PANELS='.panels |= map(if .libraryPanel != null then {libraryPanel, id, gridPos} else . end)'
CLEAR_LIBRARY_PANEL_CREATED='del(.panels[].libraryPanel.meta.created)'
CLEAR_LIBRARY_PANEL_UPDATED='del(.panels[].libraryPanel.meta.updated)'

# REQUIRED FOR PUSHING JSON-BACKED DASHBOARDS VIA THE API
# wrap the final output in a different format and use overwrite: true, to avoid .id and .version collisions
PUSH_FORMATTING='{dashboard: ., overwrite: true}'

# FOLDERS
# ids have to be unique
CLEAR_FOLDER_IDS='del(.[].id)'

path=grafana/metadata/folders.json
curl \
    -s \
    -H "Authorization: Bearer ${BEARER_TOKEN}" \
    -H 'Content-Type: application/json' \
    -H 'Accept: application/json' \
    ${BASE_URL}/api/folders \
        | jq "${CLEAR_FOLDER_IDS}" \
        > "${path}"
echo "Saved to: ${path}"

path=grafana/metadata/library.json
# save all library panels into a single file
curl -s ${PASS_URL}/api/library-elements?perPage=100 \
    | jq .result.elements \
    > ${path}
echo "Saved to: ${path}"

path=grafana/metadata/contact-points.json
# save all contact points into a single file
curl -s ${PASS_URL}/api/v1/provisioning/contact-points \
    | jq . \
    > ${path}
echo "Saved to: ${path}"

path=grafana/metadata/policies.json
# save all notification policies into a single file
curl -s ${PASS_URL}/api/v1/provisioning/policies \
    | jq . \
    > ${path}
echo "Saved to: ${path}"

path=grafana/metadata/mute-timings.json
# save all mute timings into a single file
curl -s ${PASS_URL}/api/v1/provisioning/mute-timings \
    | jq . \
    > ${path}
echo "Saved to: ${path}"

path=grafana/metadata/templates.json
# save all alert templates into a single file
curl -s ${PASS_URL}/api/v1/provisioning/templates \
    | jq . \
    > ${path}
echo "Saved to: ${path}"

# save dashboards into separate json files
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
        | jq "${CLEAR_PROM_TARGET_UID}" \
        | jq "${CLEAR_PROM_PANEL_UID}" \
        | jq "${SET_TIME_WINDOW_FROM}" \
        | jq "${SET_TIME_WINDOW_TO}" \
        | jq "${SET_REFRESH_INTERVAL}" \
        | jq "${SET_TIME_DELAY}" \
        | jq "${RESET_TEMPLATE_SELECTION}" \
        | jq "${SANITIZE_LIBRARY_PANELS}" \
        | jq "${CLEAR_LIBRARY_PANEL_CREATED}" \
        | jq "${CLEAR_LIBRARY_PANEL_UPDATED}" \
        | jq "${PUSH_FORMATTING}" \
        > "${path}"
    echo "Saved to: ${path}"
done
