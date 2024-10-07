#!/bin/bash

POSTGRES_DATA_DIR=${POSTGRES_DATA_DIR:-/data/postgres}

if [ ! -d "$POSTGRES_DATA_DIR" ]; then
    echo "Initializing PostgreSQL data directory at $POSTGRES_DATA_DIR..."
    su - postgres -c "/usr/lib/postgresql/*/bin/initdb -D $POSTGRES_DATA_DIR"
fi

echo "Updating PostgreSQL configuration for password authentication..."
sed -i "s/peer/trust/g" $POSTGRES_DATA_DIR/pg_hba.conf
sed -i "s/md5/trust/g" $POSTGRES_DATA_DIR/pg_hba.conf

echo "Starting PostgreSQL service..."
su - postgres -c "/usr/lib/postgresql/*/bin/pg_ctl -D $POSTGRES_DATA_DIR -l /var/log/postgresql/postgresql.log start"

echo "Setting up PostgreSQL user and database..."
su - postgres -c "psql -c \"ALTER USER postgres WITH PASSWORD '$POSTGRES_PASSWORD';\""
su - postgres -c "psql -c \"CREATE DATABASE $POSTGRES_DB;\""

su - postgres -c "/usr/lib/postgresql/*/bin/pg_ctl -D $POSTGRES_DATA_DIR -l /var/log/postgresql/postgresql.log restart"

if [ -f /env/prod.env ]; then
    echo "Sourcing environment variables from /env/prod.env"
    set -a
    source /env/prod.env
    set +a
fi

echo "Starting audiusd..."
exec /bin/audiusd "$@"
