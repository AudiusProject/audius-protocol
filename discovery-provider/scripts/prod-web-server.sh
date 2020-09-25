# This is a development only script that allows you to start a web-server
# without any celery dependencies. You can connect to a production RDS
# instance without writing any local indexing data to the blockchain

# you may have to change the redis url in default_config.ini to redis://docker.for.mac.localhost:5379/0
DB_URL=postgres+psycopg2://<username>:<password>@<db_port>:5432/<db_name>

function stop {
  docker-compose -f docker-compose.base.yml -f docker-compose.dev.yml down
}

# stop existing services
stop

# start new services
docker-compose -f docker-compose.base.yml -f docker-compose.dev.yml up --build -d redis-server
docker build -t discprov_read_only .
docker run -p 5000:5000 -e audius_db_url=$DB_URL -e audius_db_url_read_replica=$DB_URL discprov_read_only  /bin/bash -c ./scripts/dev-server.sh --build web-server

trap stop EXIT