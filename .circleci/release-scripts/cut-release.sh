#!/usr/bin/env bash

set -e

script=cut-release
docker build \
    -t ${script} \
    .circleci/release-scripts/dockerfiles/${script}

SSH_KEY=$(cat ssh_keys/id_rsa_d00ba019ac4658e46cac3499f61b31bb)
docker run \
    -ti \
    -e SSH_KEY="${SSH_KEY}" \
    -e GH_TOKEN="${GH_TOKEN}" \
    ${script}
