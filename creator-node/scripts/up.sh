#!/usr/bin/env bash
 
set -xe

ITERATION=${1}

cd ${PROTOCOL_DIR}/creator-node

if [[ "$RESTART" == true ]]; then
    . compose/env/unsetShellEnv.sh
    . compose/env/tmp/shellEnv${ITERATION}.sh
    docker-compose -f compose/docker-compose.yml down --remove-orphans

    (
        cd ${PROTOCOL_DIR}/libs
        npm run init-local update-cnode-config ${ITERATION}
    )
fi

mkdir -p compose/env/tmp/file-storage-${ITERATION}
. compose/env/tmp/shellEnv${ITERATION}.sh

time docker-compose -f compose/docker-compose.yml build

. compose/env/tmp/shellEnv${ITERATION}.sh
time docker-compose -f compose/docker-compose.yml up -d
. compose/env/unsetShellEnv.sh
