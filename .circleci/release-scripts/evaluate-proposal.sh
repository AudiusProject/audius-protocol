#!/usr/bin/env bash

set -e

script=evaluate-proposal
docker build \
    -t ${script} \
    .circleci/release-scripts/dockerfiles/${script}

docker run \
    -ti \
    -e OWNER_WALLET="${OWNER_WALLET}" \
    -e OWNER_PRIVATE_KEY="${OWNER_PRIVATE_KEY}" \
    -e ETH_TOKEN_ADDRESS="${ETH_TOKEN_ADDRESS}" \
    -e ETH_REGISTRY_ADDRESS="${ETH_REGISTRY_ADDRESS}" \
    -e ETH_PROVIDER_ENDPOINT="${ETH_PROVIDER_ENDPOINT}" \
    ${script}
