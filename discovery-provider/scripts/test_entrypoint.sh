#!/usr/bin/env bash

echo "Starting redis"
redis-server --daemonize yes
export audius_redis_url="redis://localhost:6379/00"

echo "Starting postgres"
chown -R postgres:postgres /db
chmod 700 /db
sudo -u postgres pg_ctl init -D /db
echo "host all all 0.0.0.0/0 md5" >>/db/pg_hba.conf
echo "listen_addresses = '*'" >>/db/postgresql.conf
sudo -u postgres pg_ctl start -D /db -o "-c shared_preload_libraries=pg_stat_statements"
sudo -u postgres createdb audius_discovery

sudo -u postgres psql -c "ALTER USER postgres PASSWORD '${postgres_password:-postgres}';"

export audius_db_url="postgresql+psycopg2://postgres:${postgres_password:-postgres}@localhost:5432/audius_discovery"
export audius_db_url_read_replica="postgresql+psycopg2://postgres:${postgres_password:-postgres}@localhost:5432/audius_discovery"

echo "Waiting for redis and postgres"
WAIT_HOSTS="localhost:6379,localhost:5432" /wait

pytest "$@"
