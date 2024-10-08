#!/bin/bash

ENV_FILE="/env/prod.env"
OVERRIDE_ENV_FILE="/env/override.env"

if [ "$NETWORK" == "stage" ]; then
    ENV_FILE="/env/stage.env"
fi

# source environment variables without overwriting existing ones
source_env_file() {
    local file=$1
    if [ -f "$file" ]; then
        echo "Sourcing environment variables from $file"
        while IFS='=' read -r key value || [ -n "$key" ]; do
            # skip lines that are comments or empty
            [[ "$key" =~ ^#.*$ ]] && continue
            [[ -z "$key" ]] && continue
            # only set variables that are not already defined (prioritize docker-passed env)
            if [ -z "${!key}" ]; then
                export "$key"="$value"
            fi
        done < "$file"
    else
        echo "Environment file $file not found!"
    fi
}

source_env_file "$ENV_FILE"
source_env_file "$OVERRIDE_ENV_FILE"

# minimum values for a core node to just run
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres}
POSTGRES_DB=${POSTGRES_DB:-audiusd}
POSTGRES_DATA_DIR=${POSTGRES_DATA_DIR:-/data/postgres}
dbUrl=${dbUrl:-postgresql://postgres:postgres@localhost:5432/audiusd?sslmode=disable}
uptimeDataDir=${uptimeDataDir:-/data/bolt}
audius_core_root_dir=${audius_core_root_dir:-/data/audiusd}
creatorNodeEndpoint=${creatorNodeEndpoint:-http://localhost}

if [ ! -d "$POSTGRES_DATA_DIR" ]; then
    echo "Initializing PostgreSQL data directory at $POSTGRES_DATA_DIR..."
    su - postgres -c "/usr/lib/postgresql/*/bin/initdb -D $POSTGRES_DATA_DIR"

    echo "Updating PostgreSQL configuration for password authentication..."
    sed -i "s/peer/trust/g" "$POSTGRES_DATA_DIR/pg_hba.conf"
    sed -i "s/md5/trust/g" "$POSTGRES_DATA_DIR/pg_hba.conf"
fi

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
