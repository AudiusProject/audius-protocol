dev::
	audius_db_url=postgres://postgres:postgres@api.audius.stereosteve.com:5454/audius_discovery \
	audius_elasticsearch_url=http://api.audius.stereosteve.com:9200 \
	npm run graphql:dev

test::
	docker compose up -d
	./tests/tests.sh

down::
	docker compose down --volumes

psql::
	docker exec -it devdb psql -U postgres
