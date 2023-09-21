#!/bin/bash

echo "Running pg_migrate.sh migrations"
(cd ddl ; DB_URL="$audius_db_url" bash pg_migrate.sh)
echo "Finished running pg_migrate.sh migrations"
