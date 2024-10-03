# audiusd

Single binary content node, running Audius Core.

> This binary is experimental at this stage and is expected to evolve and change rapidly.
  These docs exist to describe a basic method to get something running that works. They are not intended to be the end UX.

### Run a local node

Build from source
```bash
make bin/audiusd-native
```

You need a `prod.env` or whatever env you plan to connect to.
```bash
curl -s -o bin/prod.env https://raw.githubusercontent.com/AudiusProject/audius-docker-compose/refs/heads/stage/creator-node/prod.env
```

Create wrapper script to manage DB and env vars
```bash
cat << 'EOF' > bin/audiusd
#!/bin/bash

if [ "$(docker ps -q -f name=postgres)" ]; then
  echo "Postgres container is already running."
else
  echo "Starting the Postgres container..."
  docker run --name postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=audiusd -p 5432:5432 -d postgres

  until docker exec postgres pg_isready -U postgres; do
    echo "Postgres is not ready yet. Retrying in 2 seconds..."
    sleep 2
  done

  echo "Postgres is ready. Creating database 'audius_creator_node'..."
  docker exec -it postgres psql -U postgres -c "CREATE DATABASE audius_creator_node;"
fi

(
  set -a
  source prod.env
  set +a
  # if enabling mediorum, then also set:
  #   postgresDSN=postgres://postgres:postgres@localhost:5432/audius_creator_node \
  #   creatorNodeEndpoint=http://localhost \
  dbUrl=postgresql://postgres:postgres@localhost:5432/audiusd \
  uptimeDataDir=/tmp/bolt \
  audius_core_root_dir="$HOME/.audiusd" \
  ./audiusd-native
)
EOF

chmod +x bin/audiusd
```

Execute
```bash
cd audius-protocol/bin
./audiusd
```

Visit localhost console
```bash
open http://localhost/console/overview
```

Browse CometBFT RPCs https://docs.cometbft.com/v1.0/rpc/
```bash
curl http://localhost/core/comet/v1/status
curl http://localhost/core/comet/v1/block?height=1
```

Verify other services
```bash
# mediorum - enable with --storage
# curl http://localhost/health_check

# uptime
curl http://localhost/d_api/env
```

### Run a remote prod node

This assumes:
- your remote node is already running in production
- you have data stored at `/var/k8s`
- you have stopped all running docker containers
- your node has `prod.env` and `override.env` files already on it

Build from source
```bash
make bin/audiusd-x86_64-linux
```

Create wrapper script to manage DB and env vars

```bash
cat << 'EOF' > bin/audiusd
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

  if ps aux | grep -v "$0" | grep -E '[a]udiusd-native|[a]udiusd-x86_64-linux' > /dev/null; then
    echo "An audiusd process is already running."
  else
    echo "Starting audiusd-* binary"
    sudo -E nohup ./audiusd-x86_64-linux --tls > /home/ubuntu/.audiusd/log/audiusd.log 2>&1 &
    echo "...for logs 'tail -f /home/ubuntu/.audiusd/log/audiusd.log'\n"
  fi
)
EOF

chmod +x bin/audiusd
```

Copy your binary and wrapper script to the host with scp or similar.
```bash
scp ./bin/audiusd-x86_64-linux <remote-host>:~/audiusd-x86_64-linux
scp ./bin/audiusd <remote-host>:~/audiusd
```

Execute
```bash
ssh <remote-host>

ubuntu@x-x-x-x:~$ ./audiusd
ubuntu@x-x-x-x:~$ tail -f /home/ubuntu/.audiusd/log/audiusd.log
```
