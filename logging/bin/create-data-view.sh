#!/usr/bin/env bash
# https://www.elastic.co/guide/en/kibana/current/saved-objects-api-bulk-create.html
# https://${KIBANA_ENDPOINT}/app/management/kibana/dataViews

set -e

. .env
BASIC_AUTH_HEADER=$(echo -n "${ELASTIC_USER}:${ELASTIC_PASS}" | base64)
FILEBEAT_INDEX=$(cat filebeat.index)

function create_index() {
    RESPONSE=$(curl -s -X POST "${KIBANA_ENDPOINT}/api/saved_objects/_bulk_create" \
        -H 'kbn-xsrf: true' \
        -H 'Content-Type: application/json' \
        -H "Authorization: Basic ${BASIC_AUTH_HEADER}" \
        -d '[
                {
                    "type": "index-pattern",
                    "id": "filebeat-'"${FILEBEAT_INDEX}"'-app",
                    "attributes": {
                        "title": "filebeat-'"${FILEBEAT_INDEX}"'-app-*",
                        "timeFieldName": "@timestamp"
                    }
                },
                {
                    "type": "index-pattern",
                    "id": "filebeat-'"${FILEBEAT_INDEX}"'-beats",
                    "attributes": {
                        "title": "filebeat-'"${FILEBEAT_INDEX}"'-beats-*",
                        "timeFieldName": "@timestamp"
                    }
                },
                    {
                    "type": "index-pattern",
                    "id": "filebeat-'"${FILEBEAT_INDEX}"'-misc",
                    "attributes": {
                        "title": "filebeat-'"${FILEBEAT_INDEX}"'-misc-*",
                        "timeFieldName": "@timestamp"
                    }
                }
            ]')
    echo ${RESPONSE} | jq .
}

create_index