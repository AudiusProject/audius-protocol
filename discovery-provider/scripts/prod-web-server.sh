# This is a development only script that allows you to start a web-server
# without any celery dependencies. You can connect to a production RDS
# instance without writing any local indexing data to the blockchain
DB_URL=postgres+psycopg2://prod_disc_prov_audius:<password>@prod-disc-prov-db.cl38pgrjbaoh.us-west-1.rds.amazonaws.com:5432/audius_discovery

function stop {
  docker-compose -f docker-compose.base.yml -f docker-compose.dev.yml down
}

# stop existing services
stop

# start new services
docker-compose -f docker-compose.base.yml -f docker-compose.dev.yml up --build -d redis-server
docker build -t discprov_read_only .
docker run -p 5000:5000 -e audius_db_url=$DB_URL discprov_read_only  /bin/bash -c ./scripts/dev-server.sh --build web-server

trap stop EXIT