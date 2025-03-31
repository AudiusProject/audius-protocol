#!/usr/bin/env sh

set -e

cd $(dirname "$(readlink -f "$0")")/..

dbPath=$1
if [ -z "$dbPath" ]; then
  echo "Usage: $0 <dbPath> <networkId>"
  exit 1
fi

networkId=$2
if [ -z "networkId" ]; then
  echo "Usage: $0 <dbPath> <networkId>"
  exit 1
fi

mkdir -p $dbPath
npx ganache \
    --server.host "0.0.0.0" \
    --server.port 8545 \
    --wallet.deterministic \
    --wallet.totalAccounts 50 \
    --database.dbPath "$dbPath" \
    --miner.blockTime 1 \
    --chain.networkId "$networkId" \
    &

ganache_pid=$!

npx truffle migrate --network predeploy

kill $ganache_pid
