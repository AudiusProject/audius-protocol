#! /bin/sh

docker compose up -d
sleep 2
POSTGRES_PASSWORD=postgres POSTGRES_PORT=35746 ./pg_migrate.sh test

if [ -n "$1" ]; then
  docker compose exec -it db psql -U postgres;
fi

docker compose down --volumes
