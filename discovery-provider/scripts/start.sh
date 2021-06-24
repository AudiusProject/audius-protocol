#!/bin/bash

if [ -z "$audius_ipfs_host" ]; then
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
    sudo -u postgres pg_ctl start -D /db
    export audius_db_url=postgresql+psycopg2://postgres:postgres@localhost:5432/audius_discovery
    export audius_db_url_read_replica=postgresql+psycopg2://postgres:postgres@localhost:5432/audius_discovery
    export WAIT_HOSTS="localhost:5432"
    /wait
fi

./scripts/dev-server.sh &
sleep 20 # wait for migrations to finish

celery -A src.worker.celery worker --loglevel info &
celery -A src.worker.celery beat --loglevel info &

wait
