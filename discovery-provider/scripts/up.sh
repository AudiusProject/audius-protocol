#!/usr/bin/env bash
 
set -xe

shopt -s expand_aliases

ITERATION=${1}

cd ${PROTOCOL_DIR}/discovery-provider

if [[ "$UP" == true || "$RESTART" == true ]]; then
    alias dc="docker-compose \
        -f compose/docker-compose.db.yml \
        -f compose/docker-compose.redis.yml \
        -f compose/docker-compose.elasticsearch.yml \
        -f compose/docker-compose.backend.yml \
        -f compose/docker-compose.ipfs.yml"
elif [[ "$UP_WEB_SERVER" == true ]]; then
    alias dc="docker-compose \
        -f compose/docker-compose.redis.yml \
        -f compose/docker-compose.elasticsearch.yml \
        -f compose/docker-compose.ipfs.yml \
        -f compose/docker-compose.web-server.yml"
else
    echo '$UP, $RESTART, or $UP_WEB_SERVER must be set to "true"'
    exit 1
fi

if [[ "$RESTART" == true ]]; then
    . compose/env/unsetShellEnv.sh
    . compose/env/tmp/shellEnv${ITERATION}.sh
    dc down

    docker volume prune -f
    sudo rm -rf solana-programs/claimable-tokens/cli/target
    sudo rm -rf solana-programs/cli/target
    sudo rm -rf solana-programs/reward-manager/target
    sudo rm -rf discovery-provider/.venv
    sudo rm -rf discovery-provider/.mypy_cache
    sudo rm -f discovery-provider/*.log
fi

(
    cd ${PROTOCOL_DIR}/libs/initScripts
    node configureLocalDiscProv.js
)

(
    cd ${PROTOCOL_DIR}/discovery-provider/es-indexer
    npm i && npm run build
)

if [[ "$UP" == true || "$UP_WEB_SERVER" == true ]]; then
    (
        cd ${PROTOCOL_DIR}/libs
        npm run init-local configure-discprov-wallet ${ITERATION}
    )
fi

if [[ "$UP" == true || "$RESTART" == true ]]; then
    [ ! -e celerybeat.pid ] || rm celerybeat.pid
    rm -f *_dump
fi

# build docker image without node_modules
. compose/env/tmp/shellEnv${ITERATION}.sh
# build image and always return ./node_modules
time dc build --parallel

. compose/env/tmp/shellEnv${ITERATION}.sh
time dc up -d

. compose/env/unsetShellEnv.sh
echo 'Waiting 5 seconds...'
sleep 5
