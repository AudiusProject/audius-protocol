#!/bin/bash

function cd_contracts_repo {
  # Navigate to contracts repository
  if [ -d "../contracts" ]; then
    cd ../contracts/
    pwd
  else
    echo "INCORRECT REPOSITORY STRUCTURE. PLEASE FOLLOW README"
    exit 1
  fi
}

function cd_eth_contracts_repo {
  # Navigate to contracts repository
  if [ -d "../eth-contracts" ]; then
    cd ../eth-contracts/
    pwd
  else
    echo "INCORRECT REPOSITORY STRUCTURE. PLEASE FOLLOW README"
    exit 1
  fi
}

function cd_discprov_repo {
  # Navigate to discovery provider repository
  if [ -d "../packages/discovery-provider" ]; then
    cd ../packages/discovery-provider/
    pwd
  else
    echo "INCORRECT REPOSITORY STRUCTURE. PLEASE FOLLOW README"
    exit 1
  fi
}
