#!/usr/bin/env bash
 
set -xe

ITERATION=${1}

if [[ "$UP" == true || "$RESTART" == true ]]; then
    alias dc="docker-compose \
        -f compose/docker-compose.db.yml \
        -f compose/docker-compose.redis.yml \
        -f compose/docker-compose.backend.yml \
        -f compose/docker-compose.ipfs.yml"
elif [[ "$UP_WEB_SERVER" == true ]]; then
    alias dc="docker-compose \
        -f compose/docker-compose.redis.yml \
        -f compose/docker-compose.ipfs.yml \
        -f compose/docker-compose.web-server.yml"
else
    echo '$UP, $RESTART, or $UP_WEB_SERVER must be set to "true"'
    exit 1
fi

if [[ "$RESTART" == true ]]; then
    cd ${PROTOCOL_DIR}/discovery-provider
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

cd ${PROTOCOL_DIR}/libs/initScripts
node configureLocalDiscProv.js

if [[ "$UP" == true || "$UP_WEB_SERVER" == true ]]; then
    cd ${PROTOCOL_DIR}/libs
    npm run init-local configure-discprov-wallet ${ITERATION}
fi

if [[ "$UP" == true || "$RESTART" == true ]]; then
    cd ${PROTOCOL_DIR}/discovery-provider
    [ ! -e celerybeat.pid ] || rm celerybeat.pid
    rm -f *_dump
fi

# mv ./node_modules away, temporarily
cd ${PROTOCOL_DIR}/discovery-provider/es-indexer
mv node_modules /tmp/dn-node_modules

function return_node_modules() {
    cd ${PROTOCOL_DIR}/discovery-provider/es-indexer
    rm -rf node_modules
    mv /tmp/dn-node_modules node_modules
}

# build docker image without node_modules
cd ${PROTOCOL_DIR}/discovery-provider
. compose/env/tmp/shellEnv${ITERATION}.sh
# build image and always return ./node_modules
time dc build --parallel \
    && return_node_modules \
    || (return_node_modules && exit 1)

cd ${PROTOCOL_DIR}/discovery-provider
. compose/env/tmp/shellEnv${ITERATION}.sh
time dc up -d

. compose/env/unsetShellEnv.sh
echo 'Waiting 5 seconds...'
sleep 5
