#!/usr/bin/env bash
# https://www.elastic.co/guide/en/beats/filebeat/8.2/beats-api-keys.html
# https://www.elastic.co/guide/en/beats/filebeat/8.2/privileges-to-publish-events.html

set -e

. .env
BASIC_AUTH_HEADER=$(echo -n "${ELASTIC_USER}:${ELASTIC_PASS}" | base64)
ROLE=filebeat_writer
USER=service-provider
PASS=$(openssl rand -base64 30)
API_KEY_NAME=service_provider_api_key
API_KEY_TTL=1m

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
                        "create_doc",
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
                "expiration": "'"${API_KEY_TTL}"'",
                "role_descriptors": {
                    "filebeat_monitoring": {
                        "cluster": ["monitor", "read_pipeline"],
                        "index": [{
                            "names": ["filebeat-*"],
                            "privileges": [
                                "view_index_metadata",
                                "create_doc"
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
                            "view_index_metadata",
                            "create_doc"
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

# # delete_user
# # delete_role

create_role
create_user_w_role
# get_api_key
# # confirm_privileges

# # revoke_api_keys

echo $KEY_FROM_BASIC_AUTH | jq '{ name, id, api_key }'
