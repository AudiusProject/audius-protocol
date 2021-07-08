#!/bin/bash

if [ -z "$audius_ipfs_host" ]; then
    if [ -z "$(ls -A /root/.ipfs)" ]; then
        ipfs init --profile server
    fi

    ipfs daemon &
    export audius_ipfs_host=localhost
    export WAIT_HOSTS="localhost:5001"
    /wait
fi

if [ -z "$audius_redis_url" ]; then
    redis-server --daemonize yes
    export audius_redis_url="redis://localhost:6379/00"
    export WAIT_HOSTS="localhost:6379"
    /wait
fi

if [ -z "$audius_db_url" ]; then
    if [ -z "$(ls -A /db)" ]; then
        chown -R postgres:postgres /db
        chmod 700 /db
        sudo -u postgres pg_ctl init -D /db
        sudo -u postgres pg_ctl start -D /db
        sudo -u postgres createdb audius_discovery
    else
        sudo -u postgres pg_ctl start -D /db
    fi

    export audius_db_url=postgresql+psycopg2://postgres:postgres@localhost:5432/audius_discovery
    export audius_db_url_read_replica=postgresql+psycopg2://postgres:postgres@localhost:5432/audius_discovery
    export WAIT_HOSTS="localhost:5432"
    /wait
fi

./scripts/dev-server.sh &
sleep 20 # wait for migrations to finish

if [[ "$audius_no_workers" != "true" ]] && [[ "$audius_no_workers" != "1" ]]; then
    celery -A src.worker.celery worker --loglevel info &
fi

celery -A src.worker.celery beat --loglevel info &

wait
