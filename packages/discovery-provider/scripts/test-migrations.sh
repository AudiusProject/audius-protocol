#!/bin/bash

echo "Running pg_migrate.sh migrations"
(cd ddl || exit ; DB_URL="$audius_db_url" bash pg_migrate.sh test)
echo "Finished running pg_migrate.sh migrations"
