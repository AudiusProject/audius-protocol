#!/bin/bash
source ./scripts/utilities.sh

function main {
  set -e
  export audius_ipfs_port=5001
  export audius_redis_url=redis://localhost:6379/0
  export audius_delegate_owner_wallet=0x1D9c77BcfBfa66D37390BF2335f0140979a6122B
  export audius_delegate_private_key=0x3873ed01bfb13621f9301487cc61326580614a5b99f3c33cf39c6f9da3a19cad
  source venv/bin/activate
  cd_contracts_repo
  echo 'Migrating contracts'
  node_modules/.bin/truffle migrate
  echo 'Writing flask config'
  node_modules/.bin/truffle exec scripts/_contractsLocalSetup.js -run
  cd_discprov_repo
  pytest -s -v --fulltrace
}

main 
