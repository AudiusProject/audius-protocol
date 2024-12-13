#!/bin/bash

# Set default network to prod if not specified
NETWORK="${NETWORK:-prod}"
ENV_FILE="/env/${NETWORK}.env"
OVERRIDE_ENV_FILE="/env/override.env"

# Validate environment files exist
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: Network environment file not found at $ENV_FILE"
    exit 1
fi

# source environment variables without overwriting existing ones
source_env_file() {
    local file=$1
    if [ ! -f "$file" ]; then
        echo "Environment file $file not found"
        return
    fi

    echo "Loading environment from $file"
    while IFS='=' read -r key value || [ -n "$key" ]; do
        [[ "$key" =~ ^#.*$ ]] && continue
        [[ -z "$key" ]] && continue
        if [ -z "${!key}" ]; then
            val="${value%\"}"
            val="${val#\"}"
            export "$key"="$val"
        fi
    done < "$file"
}

source_env_file "$ENV_FILE"
source_env_file "$OVERRIDE_ENV_FILE"

# Set database name based on creatorNodeEndpoint
if [ -n "$creatorNodeEndpoint" ]; then
    POSTGRES_DB="audius_creator_node"
else
    POSTGRES_DB="audiusd"
fi

# Set other defaults
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="postgres"
POSTGRES_DATA_DIR=${POSTGRES_DATA_DIR:-/data/postgres}
export dbUrl="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}?sslmode=disable"
export uptimeDataDir=${uptimeDataDir:-/data/bolt}
export audius_core_root_dir=${audius_core_root_dir:-/data/core}
export creatorNodeEndpoint=${creatorNodeEndpoint:-http://localhost}

setup_postgres() {
    PG_BIN="/usr/lib/postgresql/15/bin"
    
    # Ensure directories exist with correct permissions
    mkdir -p /data
    mkdir -p "$POSTGRES_DATA_DIR"
    chown -R postgres:postgres /data
    chown -R postgres:postgres "$POSTGRES_DATA_DIR"
    chmod -R 700 "$POSTGRES_DATA_DIR"

    # Initialize if needed
    if [ -z "$(ls -A $POSTGRES_DATA_DIR)" ] || ! [ -f "$POSTGRES_DATA_DIR/PG_VERSION" ]; then
        echo "Initializing PostgreSQL data directory at $POSTGRES_DATA_DIR..."
        su - postgres -c "$PG_BIN/initdb -D $POSTGRES_DATA_DIR"
        
        # Configure authentication and logging
        sed -i "s/peer/trust/g; s/md5/trust/g" "$POSTGRES_DATA_DIR/pg_hba.conf"
        sed -i "s|#log_destination = 'stderr'|log_destination = 'stderr'|; \
                s|#logging_collector = on|logging_collector = off|" \
                "$POSTGRES_DATA_DIR/postgresql.conf"

        # Only set up database and user on fresh initialization
        echo "Setting up PostgreSQL user and database..."
        # Start PostgreSQL temporarily to create user and database
        su - postgres -c "$PG_BIN/pg_ctl -D $POSTGRES_DATA_DIR start"
        until su - postgres -c "$PG_BIN/pg_isready -q"; do
            sleep 1
        done
        
        su - postgres -c "psql -c \"ALTER USER ${POSTGRES_USER} WITH PASSWORD '${POSTGRES_PASSWORD}';\""
        su - postgres -c "psql -tc \"SELECT 1 FROM pg_database WHERE datname = '${POSTGRES_DB}'\" | grep -q 1 || \
                         psql -c \"CREATE DATABASE ${POSTGRES_DB};\""
        
        # Stop PostgreSQL to restart it properly
        su - postgres -c "$PG_BIN/pg_ctl -D $POSTGRES_DATA_DIR stop"
    fi

    # Always start PostgreSQL
    echo "Starting PostgreSQL service..."
    su - postgres -c "$PG_BIN/pg_ctl -D $POSTGRES_DATA_DIR start"

    # Wait for PostgreSQL to be ready
    until su - postgres -c "$PG_BIN/pg_isready -q"; do
        echo "Waiting for PostgreSQL to start..."
        sleep 2
    done
}

setup_postgres

echo "Starting audiusd..."
exec /bin/audiusd "$@"
