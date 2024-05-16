#!/bin/bash
sleep 10

echo "Importing dump file into PostgreSQL..."
docker exec -i testdb pg_restore --verbose --clean --no-acl --no-owner -U postgres -d default_db < discProvProduction.dump

# Provide connection string
CONNECTION_STRING="postgresql://postgres:pass@localhost:5433/postgres"
echo "Database has been seeded successfully!"
echo "Connection string: $CONNECTION_STRING"

