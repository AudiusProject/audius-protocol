#!/usr/bin/env bash

_common_setup() {
    load '../../../node_modules/bats-support/load'
    load '../../../node_modules/bats-assert/load'

    PROJECT_ROOT="$(cd "$(dirname "$BATS_TEST_FILENAME")/.." >/dev/null 2>&1 && pwd)"
}
