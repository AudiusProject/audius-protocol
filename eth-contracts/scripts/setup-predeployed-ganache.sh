#!/usr/bin/env sh

set -e
set -x

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
npx ganache --wallet.deterministic --wallet.totalAccounts 50 --database.dbPath "$dbPath" --miner.blockTime 1 --chain.networkId "$networkId" &
ganache_pid=$!

npx truffle migrate --network predeploy
npx truffle exec --network predeploy scripts/setup-dev.js

kill $ganache_pid
