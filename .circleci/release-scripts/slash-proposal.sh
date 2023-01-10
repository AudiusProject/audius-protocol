#!/usr/bin/env bash

set -e

script=slash-proposal
docker build \
    -t ${script} \
    .circleci/release-scripts/dockerfiles/${script}

SSH_KEY=$(cat ssh_keys/id_rsa_d00ba019ac4658e46cac3499f61b31bb)
docker run \
    -ti \
    -e OWNER_WALLET="${OWNER_WALLET}" \
    -e OWNER_PRIVATE_KEY="${OWNER_PRIVATE_KEY}" \
    -e ETH_TOKEN_ADDRESS="${ETH_TOKEN_ADDRESS}" \
    -e ETH_REGISTRY_ADDRESS="${ETH_REGISTRY_ADDRESS}" \
    -e ETH_PROVIDER_ENDPOINT="${ETH_PROVIDER_ENDPOINT}" \
    -e SLASH_AMOUNT="${SLASH_AMOUNT}" \
    -e SLASH_ADDRESS="${SLASH_ADDRESS}" \
    -e ADDITIONAL_NOTES="${ADDITIONAL_NOTES}" \
    ${script}
