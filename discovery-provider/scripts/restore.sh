#!/bin/bash
# Audius Container Restore Script 
# This script restores the contents of a given tar file to the
# audius-disc-prov_postgres_data volume

source ./scripts/utilities.sh

function restore {
  if [ "$1" == "" ]; then
    echo "Please provide backup name including file extension, e.g. restore.sh <your-backup-name-with-file-extension>"
    return 1
  fi

    # Ensure the backup directory is available
  set +e
  cd_backup_submodule
  set -e

  # Build the backup/restore image
  docker build -t audius-backup-container .

  # Exit backup directory
  cd ../

  echo "Restoring postgres database:"
  echo "Backup name - $1"
  cat $1 | docker run -i -v audius-disc-prov_postgres_data:/volume \
     --rm audius-backup-container restore -
}

git submodule update

restore $1
exit
