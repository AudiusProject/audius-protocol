#! /bin/sh

docker compose up -d
sleep 2

rm -f /tmp/migration_output_*.log
POSTGRES_PASSWORD=postgres POSTGRES_PORT=35746 ./pg_migrate.sh > /tmp/migration_output_1.log 2>&1 &
POSTGRES_PASSWORD=postgres POSTGRES_PORT=35746 ./pg_migrate.sh > /tmp/migration_output_2.log 2>&1 &
POSTGRES_PASSWORD=postgres POSTGRES_PORT=35746 ./pg_migrate.sh > /tmp/migration_output_3.log 2>&1 &
wait

if [ -n "$1" ]; then
  docker compose exec -it db psql -U postgres;
fi

docker compose down --volumes

# Verify only one job applied migrations
applied_count=0
for i in 1 2 3; do
    # Look for the string "Applying " in the output
    if grep -q "Applying " /tmp/migration_output_${i}.log; then
        applied_count=$((applied_count + 1))
    fi
done

if [ "$applied_count" -eq 1 ]; then
    echo "SUCCESS: Exactly 1 job ran migrations"
else
    echo "FAILURE: Expected 1 job to run migrations, got $applied_count"
    exit 1
fi

rm -f /tmp/migration_output_*.log
