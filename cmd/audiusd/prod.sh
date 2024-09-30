#!/bin/bash
(
  set -a
  source prod.env
  source override.env
  set +a

  if [ "$(docker ps -q -f name=postgres)" ]; then
    echo "Postgres container is already running."
  else
    echo "Starting the Postgres container..."
    docker run -d \
      --name postgres \
      --shm-size 2g \
      --restart always \
      -p 127.0.0.1:5432:5432 \
      -e POSTGRES_USER=postgres \
      -e POSTGRES_PASSWORD=postgres \
      -e POSTGRES_DB=audius_creator_node \
      --health-cmd='pg_isready -U postgres' \
      --health-interval=10s \
      --health-timeout=5s \
      --health-retries=3 \
      --log-driver json-file \
      --log-opt max-size=10m \
      --log-opt max-file=3 \
      --log-opt mode=non-blocking \
      --log-opt max-buffer-size=100m \
      -v /var/k8s/creator-node-db-15:/var/lib/postgresql/data \
      postgres:15.5-bookworm \
      /bin/bash -c "if [ -f /var/lib/postgresql/data/pg_hba.conf ]; then \
                     if [[ \$(tail -n 1 /var/lib/postgresql/data/pg_hba.conf) != 'hostnossl    all          all            0.0.0.0/0  trust' ]]; then \
                       echo 'hostnossl    all          all            0.0.0.0/0  trust' >> /var/lib/postgresql/data/pg_hba.conf; \
                     fi; \
                   fi; \
                   /usr/local/bin/docker-entrypoint.sh postgres \
                   -c shared_buffers=2GB \
                   -c max_connections=500 \
                   -c shared_preload_libraries=pg_stat_statements \
                   -c listen_addresses='*'"
  fi

  if ps aux | grep -v "$0" | grep -E '[a]udiusd-native|[a]udiusd-x86' > /dev/null; then
    echo "An audiusd process is already running."
  else
    echo "Starting audiusd-* binary"
    sudo -E nohup ./audiusd-x86 > /home/ubuntu/.audiusd/log/audiusd.log 2>&1 &
    echo "...for logs 'tail -f /home/ubuntu/.audiusd/log/audiusd.log'\n"
  fi
)
