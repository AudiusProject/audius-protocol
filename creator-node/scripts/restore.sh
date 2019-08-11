#!/bin/bash
# Audius Container Restore Script 
# This script restores the contents of pg/ipfs/fs volumes
# NOTE - 3 tarball files are REQUIRED to run this restore script
# Taking a backup generates 3 tar files by default, so these should be available.
source ./scripts/utilities.sh

function restore {

  # Usage: 
  #       ./scripts/restore.sh -pg_volume <pg-volume-path> -ipfs_volume <ipfs-volume-path> -fs_volume <fs_volume_path>
  # Volume backups are automatically named and organized by timestamp

  # Ensure the backup directory is available
  set +e
  cd_backup_submodule
  set -e

  # Build the backup image
  docker build -t audius-backup-container .

  # Exit backup directory
  cd ../

  pg_backup_name=$2
  echo $pg_backup_name
  cat $pg_backup_name | docker run -i -v audius-creator-node_postgres_data:/volume \
    --rm audius-backup-container restore -

  ipfs_backup_name=$4
  echo $ipfs_backup_name
  cat $ipfs_backup_name | docker run -i -v audius-creator-node_ipfs_data:/volume \
    --rm audius-backup-container restore -

  fs_backup_name=$6
  echo $fs_backup_name
  cat $fs_backup_name | docker run -i -v audius-creator-node_file_storage:/volume \
    --rm audius-backup-container restore -
}

function error_exit {
  echo "ERROR: Incorrect Usage!"
  echo "Example 1:"
  echo "./scripts/restore.sh -pg_volume <pg-volume-path> -ipfs_volume <ipfs-volume-path>\
  -fs_volume <fs_volume_path>"
  echo ""
  echo "Example 2 (no fs restore):"
  echo "./scripts/restore.sh -pg_volume <pg-volume-path> -ipfs_volume <ipfs-volume-path>"
  exit 1
}

# Require Postgres and IPFS volumes
if [ $1 != "-pg_volume" ]; then
  error_exit
fi

if [ "$3" != "-ipfs_volume" ]; then
  error_exit
fi

# Require --fs-volume path if flag is present (optional)
if [ "$5" == "-fs_volume" ]; then
  if [ "6" == "" ];
  then
    echo "FILESYSTEM"
    error_exit
  fi
fi

restore $1 $2 $3 $4 $5 $6
exit
