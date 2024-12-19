#!/bin/bash

echo "Checking if PostgreSQL is running..."
su postgres -c "pg_isready" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "PostgreSQL is not running"
    exit 1
fi

# Get all databases except templates
databases=$(su postgres -c "psql -t -c \"SELECT datname FROM pg_database WHERE datname NOT LIKE 'template%' AND datname != 'postgres';\"")

# First check all database versions
mismatch_found=false
for db in $databases postgres; do
    echo "Checking database: $db"
    version_info=$(su postgres -c "psql -d \"$db\" -t -c \"SELECT datcollversion FROM pg_database WHERE datname = '$db';\"")
    system_version=$(su postgres -c "psql -d \"$db\" -t -c \"SHOW server_collation_version;\"")
    
    echo "Database version: $version_info"
    echo "System version: $system_version"
    
    if [ "$version_info" != "$system_version" ]; then
        mismatch_found=true
        echo "WARNING: Database '$db' has collation version mismatch"
    fi
done

if [ "$mismatch_found" = true ]; then
    echo "WARNING: Database collation version mismatch detected."
    echo "This operation will:"
    echo "  1. Block new connections to the database"
    echo "  2. Wait for all active transactions to complete"
    echo "  3. Could take several hours for large databases"
    
    read -p "Do you want to proceed? (yes/no) " answer
    if [ "$answer" != "yes" ]; then
        echo "Operation cancelled."
        exit 1
    fi
    
    echo "Starting collation refresh..."
    echo "Beginning refresh at: $(date)"
    start_time=$(date +%s)
    
    # Refresh each database
    for db in $databases postgres; do
        echo "Refreshing database: $db"
        su postgres -c "psql -d \"$db\" -c \"ALTER DATABASE $db REFRESH COLLATION VERSION;\""
    done
    
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    hours=$((duration / 3600))
    minutes=$(( (duration % 3600) / 60 ))
    seconds=$((duration % 60))
    
    echo "Refresh completed successfully!"
    echo "Total time: ${hours}h ${minutes}m ${seconds}s"
else
    echo "No collation version mismatches found. No action needed."
fi
