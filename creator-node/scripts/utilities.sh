#!/bin/bash

function cd_backup_submodule {
  if [ -d "audius-backup-container" ]
  then
    cd audius-backup-container
  else
    echo "INCORRECT EXECUTION - Execute from root of audius discovery provider repo"
    exit 1
  fi
}
