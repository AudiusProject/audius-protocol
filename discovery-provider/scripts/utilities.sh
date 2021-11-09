#!/bin/bash

checkVirtualEnv() {
  if [[ "$VIRTUAL_ENV" == "" ]]; then
    INVENV=0
    echo "Please activate python virtual environment:"
    echo "source venv/bin/activate"
    exit
  fi
}

queryPortPid() {
  queriedPID=""
  queriedPID=$(lsof -i4TCP:${1} -sTCP:LISTEN -t)
  if [ "$queriedPID" != "" ]; then
    echo "Port ${1}, PID=${queriedPID}"
  else
    echo "No PID associated with port ${1}"
  fi
}

killProcessOccupyingPort() {
  queryPortPid $1
  if [ "$queriedPID" != "" ]; then
    echo $queriedPID
    kill -9 $queriedPID
  fi
}

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
  if [ -d "../discovery-provider" ]; then
    cd ../discovery-provider/
    pwd
  else
    echo "INCORRECT REPOSITORY STRUCTURE. PLEASE FOLLOW README"
    exit 1
  fi
}

function cd_backup_submodule {
  if [ -d "audius-backup-container" ]; then
    cd audius-backup-container
  else
    echo "INCORRECT EXECUTION - Execute from root of audius discovery provider repo"
    exit 1
  fi
}
