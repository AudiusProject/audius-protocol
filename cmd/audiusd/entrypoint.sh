#!/bin/bash

ENV_FILE="/env/prod.env"
OVERRIDE_ENV_FILE="/env/override.env"

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --stage) ENV_FILE="/env/stage.env";;
        --prod) ENV_FILE="/env/prod.env";;
    esac
    shift
done

if [ -f "$ENV_FILE" ]; then
    echo "Sourcing environment variables from $ENV_FILE"
    set -a
    source "$ENV_FILE"
    set +a
else
    echo "Environment file $ENV_FILE not found!"
    exit 1
fi

if [ -f "$OVERRIDE_ENV_FILE" ]; then
    echo "Sourcing environment variables from $OVERRIDE_ENV_FILE"
    set -a
    source "$OVERRIDE_ENV_FILE"
    set +a
fi

POSTGRES_DATA_DIR=${POSTGRES_DATA_DIR:-/data/postgres}

if [ ! -d "$POSTGRES_DATA_DIR" ]; then
    echo "Initializing PostgreSQL data directory at $POSTGRES_DATA_DIR..."
    su - postgres -c "/usr/lib/postgresql/*/bin/initdb -D $POSTGRES_DATA_DIR"
fi

echo "Updating PostgreSQL configuration for password authentication..."
sed -i "s/peer/trust/g" "$POSTGRES_DATA_DIR/pg_hba.conf"
sed -i "s/md5/trust/g" "$POSTGRES_DATA_DIR/pg_hba.conf"

echo "Configuring PostgreSQL to log to stderr for docker capture..."
sed -i "s|#log_destination = 'stderr'|log_destination = 'stderr'|" "$POSTGRES_DATA_DIR/postgresql.conf"
sed -i "s|#logging_collector = on|logging_collector = off|" "$POSTGRES_DATA_DIR/postgresql.conf"

echo "Starting PostgreSQL service..."
su - postgres -c "/usr/lib/postgresql/*/bin/pg_ctl -D $POSTGRES_DATA_DIR -o '-c config_file=$POSTGRES_DATA_DIR/postgresql.conf' start"

until su - postgres -c "pg_isready -q"; do
    echo "Waiting for PostgreSQL to start..."
    sleep 2
done

echo "Setting up PostgreSQL user and database..."
su - postgres -c "psql -c \"ALTER USER postgres WITH PASSWORD '$POSTGRES_PASSWORD';\""
su - postgres -c "psql -c \"CREATE DATABASE $POSTGRES_DB;\""

su - postgres -c "/usr/lib/postgresql/*/bin/pg_ctl -D $POSTGRES_DATA_DIR -o '-c config_file=$POSTGRES_DATA_DIR/postgresql.conf' restart"

echo "Starting audiusd..."
exec /bin/audiusd "$@"
