#!/usr/bin/env bash

echo "Starting postgres"
sudo -u postgres pg_ctl start -D /db -o "-c shared_preload_libraries=pg_stat_statements"
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
export audius_db_url="postgresql+psycopg2://postgres:postgres@localhost:5432/audius_discovery"
export audius_db_url_read_replica="postgresql+psycopg2://postgres:postgres@localhost:5432/audius_discovery"

echo "Starting redis"
redis-server --daemonize yes
export audius_redis_url="redis://localhost:6379/00"

if nslookup "discovery-provider-elasticsearch" >/dev/null 2>&1; then
    export audius_elasticsearch_url="http://discovery-provider-elasticsearch:9200"
    export audius_elasticsearch_run_indexer="true"
fi

echo "Waiting for redis and postgres"
WAIT_HOSTS="localhost:6379,localhost:5432" /wait

pytest "$@"
