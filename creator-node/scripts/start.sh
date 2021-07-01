#!/bin/bash

if [ -z "$ipfsHost" ]; then
    ipfs daemon &
    export ipfsHost=localhost
    export ipfsPort=5001
    export WAIT_HOSTS="localhost:5001"
    /usr/bin/wait
fi

if [ -z "$redisHost" ]; then
    redis-server --daemonize yes
    export redisHost=localhost
    export redisPort=6379
    export WAIT_HOSTS="localhost:6379"
    /usr/bin/wait
fi

if [ -z "$dbUrl" ]; then
    sudo -u postgres pg_ctl start -D /db
    export dbUrl=postgresql://postgres:postgres@localhost:5432/audius_creator_node
    export WAIT_HOSTS="localhost:5432"
    /usr/bin/wait
fi

node src/index.js
