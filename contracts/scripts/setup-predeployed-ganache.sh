#!/usr/bin/env sh

set -e

dbPath=$1
if [ -z "$dbPath" ]; then
  echo "Usage: $0 <dbPath>"
  exit 1
fi

mkdir -p $dbPath
npx ganache --wallet.deterministic --wallet.totalAccounts 50 --database.dbPath "$dbPath" &
ganache_pid=$!

npx truffle migrate --to 4 --network predeploy

kill $ganache_pid
