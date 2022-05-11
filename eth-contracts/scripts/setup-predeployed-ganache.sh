#!/usr/bin/env sh

set -e

dbPath=$1
if [ -z "$dbPath" ]; then
  echo "Usage: $0 <dbPath>"
  exit 1
fi

mkdir -p $dbPath
ganache --wallet.deterministic --wallet.totalAccounts 50 --database.dbPath "$dbPath" --miner.blockTime 1 &
ganache_pid=$!

npx truffle migrate --to 12 --network predeploy

kill $ganache_pid
