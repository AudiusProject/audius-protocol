#!/bin/bash

if [[ -z "$audius_loggly_disable" ]]; then
    if [[ -n "$audius_loggly_token" ]]; then
        audius_loggly_tags=$(echo $audius_loggly_tags | python3 -c "print(' '.join(f'tag=\\\\\"{i}\\\\\"' for i in input().split(',')))")
        mkdir -p /var/spool/rsyslog
        mkdir -p /etc/rsyslog.d
        cat >/etc/rsyslog.d/22-loggly.conf <<EOF
\$WorkDirectory /var/spool/rsyslog # where to place spool files
\$ActionQueueFileName fwdRule1   # unique name prefix for spool files
\$ActionQueueMaxDiskSpace 1g    # 1gb space limit (use as much as possible)
\$ActionQueueSaveOnShutdown on   # save messages to disk on shutdown
\$ActionQueueType LinkedList    # run asynchronously
\$ActionResumeRetryCount -1    # infinite retries if host is down

template(name="LogglyFormat" type="string"
 string="<%pri%>%protocol-version% %timestamp:::date-rfc3339% %HOSTNAME% %app-name% %procid% %msgid% [$audius_loggly_token@41058 $audius_loggly_tags \\"$audius_discprov_hostname\\"] %msg%\n")

# Send messages to Loggly over TCP using the template.
action(type="omfwd" protocol="tcp" target="logs-01.loggly.com" port="514" template="LogglyFormat")
EOF
        rsyslogd
    fi
fi

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

PORT=5000
if [[ "$audius_openresty_enable" == true ]]; then
    openresty -p /usr/local/openresty -c /usr/local/openresty/conf/nginx.conf
    tail -f /usr/local/openresty/logs/access.log | python3 scripts/openresty_log_convertor.py INFO | tee >(logger -t openresty) &
    tail -f /usr/local/openresty/logs/error.log | python3 scripts/openresty_log_convertor.py ERROR | tee >(logger -t openresty) &
    PORT=3000
fi

if [ "$audius_db_run_migrations" != false ]; then
    echo "Running alembic migrations"
    export PYTHONPATH='.'
    alembic upgrade head
    echo "Finished running migrations"
fi

if [[ "$audius_discprov_dev_mode" == "true" ]]; then
    export FLASK_APP=src.app
    export FLASK_ENV=development

    exec flask run --host=0.0.0.0 --port $PORT | tee >(logger -t server) server.log &
    if [[ "$audius_no_workers" != "true" ]] && [[ "$audius_no_workers" != "1" ]]; then
        celery -A src.worker.celery worker --loglevel $audius_discprov_loglevel 2>&1 | tee >(logger -t worker) worker.log &
        celery -A src.worker.celery beat --loglevel $audius_discprov_loglevel 2>&1 | tee >(logger -t beat) beat.log &
    fi
else
    WORKER_CLASS="${audius_gunicorn_worker_class:-sync}"
    WORKERS="${audius_gunicorn_workers:-2}"
    THREADS="${audius_gunicorn_threads:-8}"

    exec gunicorn \
        -b ":$PORT" \
        --access-logfile - \
        --error-logfile - \
        --log-level=$audius_disprov_loglevel \
        --worker-class=$WORKER_CLASS \
        --workers=$WORKERS \
        --threads=$THREADS \
        src.wsgi:app | tee >(logger -t server) &

    if [[ "$audius_no_workers" != "true" ]] && [[ "$audius_no_workers" != "1" ]]; then
        celery -A src.worker.celery worker --loglevel $audius_discprov_loglevel 2>&1 | tee >(logger -t worker) &
        celery -A src.worker.celery beat --loglevel $audius_discprov_loglevel 2>&1 | tee >(logger -t beat) &
    fi

    docker run -d --name watchtower -v /var/run/docker.sock:/var/run/docker.sock containrrr/watchtower --interval 10
fi

wait
