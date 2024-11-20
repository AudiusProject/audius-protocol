#!/bin/bash

POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres}
POSTGRES_DB=${POSTGRES_DB:-audius}
POSTGRES_DATA_DIR=${POSTGRES_DATA_DIR:-/audius/data}

if [ ! -d "$POSTGRES_DATA_DIR" ]; then
    echo "Initializing PostgreSQL data directory at $POSTGRES_DATA_DIR..."
    su - postgres -c "/usr/lib/postgresql/*/bin/initdb -D $POSTGRES_DATA_DIR"

    echo "Updating PostgreSQL configuration for password authentication..."
    sed -i "s/peer/trust/g" "$POSTGRES_DATA_DIR/pg_hba.conf"
    sed -i "s/md5/trust/g" "$POSTGRES_DATA_DIR/pg_hba.conf"
fi

chown -R postgres:postgres "$POSTGRES_DATA_DIR"
chmod -R u+rwx,g-rwx,o-rwx "$POSTGRES_DATA_DIR"

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
su - postgres -c "psql -tc \"SELECT 1 FROM pg_database WHERE datname = '$POSTGRES_DB'\" | grep -q 1 || psql -c 'CREATE DATABASE $POSTGRES_DB;'"

su - postgres -c "/usr/lib/postgresql/*/bin/pg_ctl -D $POSTGRES_DATA_DIR -o '-c config_file=$POSTGRES_DATA_DIR/postgresql.conf' restart"

echo "Starting audiusd..."
exec /bin/audiusd "$@"
