docker-compose up -d
sleep 2
POSTGRES_PASSWORD=postgres POSTGRES_PORT=35746 ./pg_migrate.sh test
docker-compose down --volumes
