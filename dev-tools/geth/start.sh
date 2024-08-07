#!/bin/sh
dockerd &

while (! docker stats --no-stream ); do
  echo "Waiting for Docker daemon to start..."
  sleep 1
done

docker-compose up --build -d
