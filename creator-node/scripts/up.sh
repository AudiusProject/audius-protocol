#!/usr/bin/env bash
 
set -xe

ITERATION=${1}

cd ${PROTOCOL_DIR}/creator-node

if [[ "$RESTART" == true ]]; then
    . compose/env/unsetShellEnv.sh
    . compose/env/tmp/shellEnv${ITERATION}.sh
    docker-compose -f compose/docker-compose.yml down --remove-orphans

    (
        cd libs/
        npm run init-local update-cnode-config ${ITERATION}
    )
fi

mkdir -p compose/env/tmp/file-storage-${ITERATION}
. compose/env/tmp/shellEnv${ITERATION}.sh

function return_node_modules() {
    # if ./node_modules has been created and modified, copy it's content to /tmp
    if [[ -d node_modules ]]; then
        mv node_modules/* /tmp/cn-node_modules/ || true
    fi

    # always ensure no ./node_modules (to prevent ./node_modules/node_modules/*)
    rm -rf node_modules

    # return node_modules
    mv /tmp/cn-node_modules node_modules
}

# build docker image without node_modules
if [[ "${ITERATION}" == 1 ]]; then
    # mv ./node_modules away, temporarily
    mv node_modules /tmp/cn-node_modules

    # build image and always return ./node_modules
    time docker-compose -f compose/docker-compose.yml build \
        && return_node_modules \
        || (return_node_modules && exit 1)
fi

. compose/env/tmp/shellEnv${ITERATION}.sh
time docker-compose -f compose/docker-compose.yml up -d
. compose/env/unsetShellEnv.sh
