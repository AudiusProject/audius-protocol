#!/bin/bash

echo "Running alembic migrations"
export PYTHONPATH='.'
alembic upgrade head
echo "Finished running alembic migrations"

echo "Running dbmate migrations"
cd /tmp && \
    curl -fsSL -o /usr/local/bin/dbmate https://github.com/amacneil/dbmate/releases/latest/download/dbmate-linux-amd64 && \
    chmod +x /usr/local/bin/dbmate && \
    cd /audius-discovery-provider

DATABASE_URL="${audius_db_url/\+psycopg2}?sslmode=disable" dbmate --wait --no-dump-schema --migrations-dir comms/discovery/db/migrations up
echo "Finished running dbmate migrations"
