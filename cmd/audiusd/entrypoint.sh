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
        # skip comments and empty lines
        [[ "$key" =~ ^#.*$ ]] && continue
        [[ -z "$key" ]] && continue
        
        # only set if not already defined (prioritize docker-passed env)
        if [ -z "${!key}" ]; then
            # strip quotations
            val="${value%\"}"
            val="${val#\"}"
            export "$key"="$val"
        fi
    done < "$file"
}

source_env_file "$ENV_FILE"
source_env_file "$OVERRIDE_ENV_FILE"

# minimum values for a core node to just run
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres}
POSTGRES_DB=${POSTGRES_DB:-audiusd}
POSTGRES_DATA_DIR=${POSTGRES_DATA_DIR:-/data/postgres}
export dbUrl=${dbUrl:-postgresql://postgres:postgres@localhost:5432/audiusd?sslmode=disable}
export uptimeDataDir=${uptimeDataDir:-/data/bolt}
export audius_core_root_dir=${audius_core_root_dir:-/data/core}
export creatorNodeEndpoint=${creatorNodeEndpoint:-http://localhost}

setup_postgres() {
    # Find PostgreSQL binaries directory
    PG_BIN="/usr/lib/postgresql/15/bin"
    
    # Ensure parent data directory exists with correct permissions
    mkdir -p /data
    chown postgres:postgres /data
    
    # Ensure postgres data directory exists with correct permissions
    mkdir -p "$POSTGRES_DATA_DIR"
    chown postgres:postgres "$POSTGRES_DATA_DIR"

    # Check if directory is empty or not initialized
    if [ -z "$(ls -A $POSTGRES_DATA_DIR)" ] || ! [ -f "$POSTGRES_DATA_DIR/PG_VERSION" ]; then
        echo "Initializing PostgreSQL data directory at $POSTGRES_DATA_DIR..."
        
        # Initialize the database
        su - postgres -c "$PG_BIN/initdb -D $POSTGRES_DATA_DIR"
        
        # Configure authentication
        sed -i "s/peer/trust/g; s/md5/trust/g" "$POSTGRES_DATA_DIR/pg_hba.conf"
        
        # Configure logging
        sed -i "s|#log_destination = 'stderr'|log_destination = 'stderr'|; \
                s|#logging_collector = on|logging_collector = off|" \
                "$POSTGRES_DATA_DIR/postgresql.conf"
    fi

    # Set permissions (after initialization or for existing data)
    chown -R postgres:postgres "$POSTGRES_DATA_DIR"
    chmod -R 700 "$POSTGRES_DATA_DIR"

    # Start PostgreSQL
    echo "Starting PostgreSQL service..."
    su - postgres -c "$PG_BIN/pg_ctl -D $POSTGRES_DATA_DIR start"

    # Wait for PostgreSQL to be ready
    until su - postgres -c "$PG_BIN/pg_isready -q"; do
        echo "Waiting for PostgreSQL to start..."
        sleep 2
    done

    # Setup database
    echo "Setting up PostgreSQL user and database..."
    su - postgres -c "psql -c \"ALTER USER postgres WITH PASSWORD '$POSTGRES_PASSWORD';\""
    su - postgres -c "psql -tc \"SELECT 1 FROM pg_database WHERE datname = '$POSTGRES_DB'\" | grep -q 1 || \
                     psql -c \"CREATE DATABASE $POSTGRES_DB;\""
}

setup_postgres

echo "Starting audiusd..."
exec /bin/audiusd "$@"
