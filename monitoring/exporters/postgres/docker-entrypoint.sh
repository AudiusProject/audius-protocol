#!/bin/sh

# default case for discovery provider
export DATA_SOURCE_NAME="${audius_db_url}?sslmode=disable"

if [ "$*" = "--read-replica" ]; then
    export DATA_SOURCE_NAME="${audius_db_url_read_replica}?sslmode=disable"
fi

if [ "$*" = "--creator-node" ]; then
    export DATA_SOURCE_NAME=${dbUrl}?sslmode=disable
fi

if [ "$*" = "--identity-service" ]; then
    export DATA_SOURCE_NAME=${dbUrl}?sslmode=disable
fi

# don't expose IP addresses, by overwriting the server label
/bin/postgres_exporter --constantLabels server=server
