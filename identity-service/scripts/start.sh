#!/bin/bash

if [ -z "$redisHost" ]; then
    redis-server --daemonize yes
    export redisHost=localhost
    export redisPort=6379
    export WAIT_HOSTS="localhost:6379"
    /usr/bin/wait
fi

if [ -z "$dbUrl" ]; then
    if [ -z "$(ls -A /db)" ]; then
        chown -R postgres:postgres /db
        chmod 700 /db
        sudo -u postgres pg_ctl init -D /db
        echo "host all all 0.0.0.0/0 md5" >>/db/pg_hba.conf
        echo "listen_addresses = '*'" >>/db/postgresql.conf
        sudo -u postgres pg_ctl start -D /db
        sudo -u postgres createdb audius_identity_service
    else
        sudo -u postgres pg_ctl start -D /db
    fi

    sudo -u postgres psql -c "ALTER USER postgres PASSWORD '${postgres_password:-postgres}';"

    export dbUrl="postgresql://postgres:${postgres_password:-postgres}@localhost:5432/audius_identity_service"
    export WAIT_HOSTS="localhost:5432"
    /usr/bin/wait
fi

node src/index.js
