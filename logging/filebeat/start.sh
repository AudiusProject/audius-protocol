#!/usr/bin/env bash

set -ex

if [[ -z "$audius_loggly_disable" ]]; then
    /usr/local/bin/docker-entrypoint -environment container
fi
