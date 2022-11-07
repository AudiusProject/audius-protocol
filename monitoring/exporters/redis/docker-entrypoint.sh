#!/bin/sh

# default case for discovery provider
export REDIS_ADDR=${audius_redis_url}

if [ "$*" = "--creator-node" ]; then
    export REDIS_ADDR=redis://${redisHost}:${redisPort}
fi

if [ "$*" = "--identity-service" ]; then
    export REDIS_ADDR=redis://${redisHost}:${redisPort}
fi

/redis_exporter
