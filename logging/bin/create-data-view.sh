#!/usr/bin/env bash

# create indexes within Elastic Search that is exposed via Kibana

# https://www.elastic.co/guide/en/kibana/current/saved-objects-api-bulk-create.html
# https://${KIBANA_ENDPOINT}/app/management/kibana/dataViews

set -e

. .env
BASIC_AUTH_HEADER=$(echo -n "${ELASTIC_USER}:${ELASTIC_PASS}" | base64)
CURRENT_INDEX_VERSION=$(cat current_index_version)

function create_index() {
    RESPONSE=$(curl -s -X POST "${KIBANA_ENDPOINT}/api/saved_objects/_bulk_create" \
        -H 'kbn-xsrf: true' \
        -H 'Content-Type: application/json' \
        -H "Authorization: Basic ${BASIC_AUTH_HEADER}" \
        -d '[
                {
                    "type": "index-pattern",
                    "id": "filebeat-'"${CURRENT_INDEX_VERSION}"'-app",
                    "attributes": {
                        "title": "filebeat-'"${CURRENT_INDEX_VERSION}"'-app-*",
                        "timeFieldName": "@timestamp"
                    }
                },
                {
                    "type": "index-pattern",
                    "id": "filebeat-'"${CURRENT_INDEX_VERSION}"'-db",
                    "attributes": {
                        "title": "filebeat-'"${CURRENT_INDEX_VERSION}"'-db-*",
                        "timeFieldName": "@timestamp"
                    }
                },
                {
                    "type": "index-pattern",
                    "id": "filebeat-'"${CURRENT_INDEX_VERSION}"'-beats",
                    "attributes": {
                        "title": "filebeat-'"${CURRENT_INDEX_VERSION}"'-beats-*",
                        "timeFieldName": "@timestamp"
                    }
                },
                    {
                    "type": "index-pattern",
                    "id": "filebeat-'"${CURRENT_INDEX_VERSION}"'-misc",
                    "attributes": {
                        "title": "filebeat-'"${CURRENT_INDEX_VERSION}"'-misc-*",
                        "timeFieldName": "@timestamp"
                    }
                }
            ]')
    echo ${RESPONSE} | jq .
}

create_index