#!/bin/bash
set -e

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
        echo "host all all 0.0.0.0/0 md5" >>/db/pg_hba.conf
        echo "listen_addresses = '*'" >>/db/postgresql.conf
        sudo -u postgres pg_ctl start -D /db
        sudo -u postgres createdb audius_discovery
    else
        sudo -u postgres pg_ctl start -D /db
    fi

    sudo -u postgres psql -c "ALTER USER postgres PASSWORD '${postgres_password:-postgres}';"

    export audius_db_url="postgresql+psycopg2://postgres:${postgres_password:-postgres}@localhost:5432/audius_discovery"
    export audius_db_url_read_replica="postgresql+psycopg2://postgres:${postgres_password:-postgres}@localhost:5432/audius_discovery"
    export WAIT_HOSTS="localhost:5432"
    /wait
fi

export PYTHONUNBUFFERED=1

audius_discprov_loglevel=${audius_discprov_loglevel:-info}

# used to remove data that may have been persisted via a k8s emptyDir
export audius_prometheus_container=server

# start api server + celery workers
if [[ "$audius_discprov_dev_mode" == "true" ]]; then
    # run alembic migrations
    if [ "$audius_db_run_migrations" != false ]; then
        echo "Running alembic migrations"
        export PYTHONPATH='.'
        alembic upgrade head
        echo "Finished running migrations"
    fi

    if [[ "$audius_service" == "server" ]]; then
        ./scripts/dev-server.sh
    fi
    if [[ "$audius_no_workers" != "true" ]] && [[ "$audius_no_workers" != "1" ]]; then
        if [[ "$audius_service" == "worker" ]]; then
            watchmedo auto-restart --directory ./ --pattern=*.py --recursive -- celery -A src.worker.celery worker --loglevel $audius_discprov_loglevel
        fi
        if [[ "$audius_service" == "beat" ]]; then
            celery -A src.worker.celery beat --loglevel $audius_discprov_loglevel
        fi
    fi
else
    if [[ "$audius_service" == "server" ]]; then
        ./scripts/prod-server.sh
    fi
    if [[ "$audius_no_workers" != "true" ]] && [[ "$audius_no_workers" != "1" ]]; then
        if [[ "$audius_service" == "worker" ]]; then
            celery -A src.worker.celery worker --loglevel $audius_discprov_loglevel
        fi
        if [[ "$audius_service" == "beat" ]]; then
            celery -A src.worker.celery beat --loglevel $audius_discprov_loglevel
        fi
    fi
fi

wait
