#!/bin/bash
# Audius Container Backup Script 
# This script backs up the contents of the audius-disc-prov_postgres_data volume to a
# tarball
source ./scripts/utilities.sh

function backup {
  if [ "$1" == "" ]; then
    echo "Please provide backup name, e.g. backup.sh <your-backup-name>"
    return 1
  fi

  # Ensure the backup directory is available
  set +e
  cd_backup_submodule
  set -e

  # Build the backup image
  docker build -t audius-backup-container .

  # Exit backup directory
  cd ../

  # Perform backup operation
  echo "Backing up postgres database"
  echo "Backup name - $1, filename=$1.tar.bz"
  docker run -v audius-disc-prov_postgres_data:/volume \
    --rm audius-backup-container backup -> "$1.tar.bz2"
}

git submodule update

backup $1
exit
