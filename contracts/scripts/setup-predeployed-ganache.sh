#!/usr/bin/env sh

set -e

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
  --server.port 8546 \
  --logging.quiet \
  --wallet.deterministic \
  --wallet.totalAccounts 50 \
  --database.dbPath "$dbPath" \
  --chain.networkId "$networkId" \
  &

npx truffle migrate --network predeploy

kill $ganache_pid
