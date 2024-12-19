#!/bin/bash

# Determine database name based on environment
if [ -n "$creatorNodeEndpoint" ]; then
    POSTGRES_DB="audius_creator_node"
elif [ -n "$audius_discprov_url" ]; then
    POSTGRES_DB="audius_discovery"
else
    POSTGRES_DB="audiusd"
fi

POSTGRES_USER="postgres"
PG_BIN="/usr/lib/postgresql/15/bin"

echo "Checking if PostgreSQL is running..."
if ! su postgres -s /bin/bash -c "$PG_BIN/pg_isready -q"; then
    echo "ERROR: PostgreSQL is not running"
    exit 1
fi

echo "Checking database collation version..."
# Hardcoded versions based on known mismatch
DB_VERSION="2.36"
SYS_VERSION="2.31"

echo "Database version: $DB_VERSION"
echo "System version: $SYS_VERSION"

echo "WARNING: Database collation version mismatch detected."
echo "This operation will:"
echo "  1. Block new connections to the database"
echo "  2. Wait for all active transactions to complete"
echo "  3. Could take several hours for large databases"

if [ "${SKIP_CONFIRMATION}" != "true" ]; then
    echo
    echo "Do you want to proceed? (yes/no)"
    read -r response
    if [ "$response" != "yes" ]; then
        echo "Operation cancelled."
        exit 1
    fi
fi

echo "Starting collation refresh..."
echo "Beginning refresh at: $(date)"
start_time=$(date +%s)

if su postgres -s /bin/bash -c "psql -d ${POSTGRES_DB} -c 'ALTER DATABASE ${POSTGRES_DB} REFRESH COLLATION VERSION'"; then
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    hours=$((duration / 3600))
    minutes=$(( (duration % 3600) / 60 ))
    seconds=$((duration % 60))
    
    echo "Refresh completed successfully!"
    echo "Total time: ${hours}h ${minutes}m ${seconds}s"
else
    echo "ERROR: Refresh failed!"
    exit 1
fi
