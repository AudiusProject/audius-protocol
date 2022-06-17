#!/usr/bin/env bash

set -e

cd $(dirname "$(readlink -f "$0")")/..

ledger_dir=$1
if [[ "$ledger_dir" == "" ]]; then
    echo "Usage: $o <ledgerDir>"
    exit 1
fi

./scripts/build.sh

mkdir -p $ledger_dir
solana-test-validator --ledger $ledger_dir &
solana_test_validator_pid=$!

SOLANA_HOST="http://127.0.0.1:8899" ./scripts/deploy.sh

kill $solana_test_validator_pid
