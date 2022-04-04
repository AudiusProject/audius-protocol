#!/bin/bash
source ./scripts/utilities.sh

function install_ask {
  # $1 = package to ask about installing
  read -p "
Reset your local ganache instance?  (y/n)" -n 1 -r
  echo
  [[ $REPLY =~ ^[Yy]$ ]]
}

function migrate_contracts {
  # $1 = package to ask about installing
  read -p "
Migrate contracts and overwrite contract_config.ini?  (y/n)" -n 1 -r
  echo
  [[ $REPLY =~ ^[Yy]$ ]]
}

function main {

  set -e

  printf '\nAudius Discovery Provider - Local Setup'
  printf '\n%20s\n' | tr ' ' -

  cd_contracts_repo

  set +e
  if install_ask
  then 
    echo 'Resetting ganache...'
    npm run ganache-q
    npm run ganache
  fi
  set -e

  if migrate_contracts
  then
    set -o xtrace

    echo '\nMigrating contracts'
    node_modules/.bin/truffle migrate

    echo '\nWriting flask config file'
    node_modules/.bin/truffle exec scripts/migrate-contracts.js
  fi

  cd_discprov_repo
}

main "$@"
