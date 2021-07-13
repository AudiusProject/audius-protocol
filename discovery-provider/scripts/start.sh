#!/bin/bash

if [[ -n "$LOGGLY_TOKEN" ]]; then
    LOGGLY_TAGS=$(echo $LOGGLY_TAGS | python3 -c "print(' '.join(f'tag=\\\\\"{i}\\\\\"' for i in input().split(',')))")
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
 string="<%pri%>%protocol-version% %timestamp:::date-rfc3339% %HOSTNAME% %app-name% %procid% %msgid% [$LOGGLY_TOKEN@41058 $LOGGLY_TAGS] %msg%\n")

# Send messages to Loggly over TCP using the template.
action(type="omfwd" protocol="tcp" target="logs-01.loggly.com" port="514" template="LogglyFormat")
EOF
    rsyslogd
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

exec 3>&1 # create fd 3 which redirects to stdout (see https://unix.stackexchange.com/a/640404/408588)

./scripts/dev-server.sh 2>&1 | tee >&3 | logger &
sleep 20 # wait for migrations to finish

if [[ "$audius_no_workers" != "true" ]] && [[ "$audius_no_workers" != "1" ]]; then
    celery -A src.worker.celery worker --loglevel info 2>&1 | tee >&3 | logger &
fi

celery -A src.worker.celery beat --loglevel info 2>&1 | tee >&3 | logger &

wait
