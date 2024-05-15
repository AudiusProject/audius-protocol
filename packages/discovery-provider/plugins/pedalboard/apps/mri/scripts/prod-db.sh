#!/bin/bash
docker stop testdb && docker rm testdb

docker run --name testdb -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=pass -e POSTGRES_DB=default_db -p 5433:5432 -d postgres

sleep 10

echo "Importing dump file into PostgreSQL..."
docker exec -i testdb pg_restore --verbose --clean --no-acl --no-owner -U postgres -d default_db < discProvProduction.dump

# Provide connection string
CONNECTION_STRING="postgresql://postgres:pass@localhost:5433/postgres"
echo "Database has been seeded successfully!"
echo "Connection string: $CONNECTION_STRING"

