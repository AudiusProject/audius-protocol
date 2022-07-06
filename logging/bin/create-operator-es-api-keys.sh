#!/usr/bin/env bash

# create an Elastic Search API key for third party node operators

# https://www.elastic.co/guide/en/beats/filebeat/8.2/beats-api-keys.html
# https://www.elastic.co/guide/en/beats/filebeat/8.2/privileges-to-publish-events.html

set -e

. .env
ELASTIC_ENDPOINT=$(echo ${ELASTIC_ENDPOINT} | base64 -d)
BASIC_AUTH_HEADER=$(echo -n "${ELASTIC_USER}:${ELASTIC_PASS}" | base64)
ROLE=filebeat_writer
USER=service-provider
PASS=$(openssl rand -base64 30)
API_KEY_NAME=service_provider_api_key

function delete_user() {
    # https://www.elastic.co/guide/en/elasticsearch/reference/8.2/security-api-delete-user.html
    curl -s -X DELETE "${ELASTIC_ENDPOINT}/_security/user/${USER}" \
        -H "Authorization: Basic ${BASIC_AUTH_HEADER}" | jq .
}

function delete_role() {
    # https://www.elastic.co/guide/en/elasticsearch/reference/8.2/security-api-delete-role.html
    curl -s -X DELETE "${ELASTIC_ENDPOINT}/_security/role/${ROLE}" \
        -H "Authorization: Basic ${BASIC_AUTH_HEADER}" | jq .
}

function create_role() {
    # https://github.com/jlim0930/scripts/blob/master/deploy-elastic.sh
    RESPONSE=$(curl -s -X POST "${ELASTIC_ENDPOINT}/_security/role/${ROLE}" \
        -H 'Content-Type: application/json' \
        -H "Authorization: Basic ${BASIC_AUTH_HEADER}" \
        -d '{
                "cluster": [
                    "monitor",
                    "read_pipeline",
                    "manage",
                    "manage_own_api_key"
                ],
                "indices": [{
                    "names": ["filebeat-*"],
                    "privileges": [
                        "auto_configure",
                        "create_doc",
                        "create_index",
                        "view_index_metadata"
                    ]
                }]
            }')
    # echo ${RESPONSE} | jq .
}

function create_user_w_role() {
    # https://www.elastic.co/guide/en/elasticsearch/reference/8.2/security-api-put-user.html
    RESPONSE=$(curl -s -X POST "${ELASTIC_ENDPOINT}/_security/user/${USER}" \
        -H 'Content-Type: application/json' \
        -H "Authorization: Basic ${BASIC_AUTH_HEADER}" \
        -d '{
                "password" : "'"${PASS}"'",
                "roles" : [ "'"${ROLE}"'" ]
            }')
    # echo ${RESPONSE} | jq .
}


function get_api_key() {
    # https://www.elastic.co/guide/en/elasticsearch/reference/8.2/security-api-get-api-key.html
    # https://www.elastic.co/guide/en/elasticsearch/reference/8.2/security-api-create-api-key.html
    BASIC_AUTH_HEADER=$(echo -n "${USER}:${PASS}" | base64)
    KEY_FROM_BASIC_AUTH=$(curl -s -X POST ${ELASTIC_ENDPOINT}/_security/api_key \
        -H 'Content-Type: application/json' \
        -H "Authorization: Basic ${BASIC_AUTH_HEADER}" \
        -d '{
                "name": "'"${API_KEY_NAME}"'",
                "role_descriptors": {
                    "filebeat_monitoring": {
                        "cluster": ["monitor", "read_pipeline"],
                        "index": [{
                            "names": ["filebeat-*"],
                            "privileges": [
                                "auto_configure",
                                "create_doc",
                                "create_index",
                                "view_index_metadata"
                            ]
                        }]
                    }
                }
            }')
}

function confirm_privileges() {
    # https://www.elastic.co/guide/en/elasticsearch/reference/8.2/security-api-has-privileges.html
    # equivalent to $(echo $KEY_FROM_BASIC_AUTH | jq -j '.id + ":" + .api_key' | base64)
    KEY_FROM_BASIC_AUTH_HEADER=$(echo $KEY_FROM_BASIC_AUTH | jq -j .encoded)
    curl -s -X GET ${ELASTIC_ENDPOINT}/_security/user/_has_privileges \
        -H 'Content-Type: application/json' \
        -H "Authorization: ApiKey ${KEY_FROM_BASIC_AUTH_HEADER}" \
        -d '{
                "cluster": [
                    "read_pipeline",
                    "monitor"
                ],
                "index": [
                    {
                        "names": ["filebeat-*"],
                        "privileges": [
                            "auto_configure",
                            "create_doc",
                            "create_index",
                            "view_index_metadata"
                        ]
                    }
                ]
            }' | jq
}

function revoke_api_keys() {
    # https://www.elastic.co/guide/en/elasticsearch/reference/8.2/security-api-invalidate-api-key.html
    BASIC_AUTH_HEADER=$(echo -n "${ELASTIC_USER}:${ELASTIC_PASS}" | base64)
    curl -s -X DELETE ${ELASTIC_ENDPOINT}/_security/api_key \
        -H 'Content-Type: application/json' \
        -H "Authorization: Basic ${BASIC_AUTH_HEADER}" \
        -d '{
            "name" : "'"${API_KEY_NAME}"'"
            }' | jq
}

if [[ "${1}" == "delete-all" ]]; then
    revoke_api_keys
    delete_user
    delete_role
else
    create_role
    create_user_w_role
    get_api_key

    if [[ "${1}" == "confirm-privileges" ]]; then
        confirm_privileges
    else
        echo $KEY_FROM_BASIC_AUTH | jq '{ name, id, api_key }'
    fi
fi
