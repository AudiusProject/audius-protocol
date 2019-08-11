#!/bin/bash
# Audius Container Backup Script 
# This script backs up the contents of the postgres, ipfs, and file storage volumes into a 
# tarball
source ./scripts/utilities.sh

function backup {

  # Usage, ./scripts/backup.sh
  # Volume backups are automatically named and organized by timestamp

  # Ensure the backup directory is available
  set +e
  cd_backup_submodule
  set -e

  # Build the backup image
  docker build -t audius-backup-container .

  # Exit backup directory
  cd ../

  # Establish current backup name
  current_time_prefix=$(date "+%Y-%m-%d_%H-%M-%S")
  backup_dir_name="backups-$current_time_prefix"
  # Create directory for backups
  mkdir $backup_dir_name
  pg_backup_name="pg_data-$current_time_prefix.tar.bz2"
  ipfs_backup_name="ipfs_data-$current_time_prefix.tar.bz2"
  fs_backup_name="fs_data-$current_time_prefix.tar.bz2"

  echo "Backing up creator node containers:"

  # Backup each of the relevant volumes and move to backup dir
  echo $ipfs_backup_name
  docker run -v audius-creator-node_ipfs_data:/volume \
    --rm audius-backup-container backup -> $ipfs_backup_name
  mv $ipfs_backup_name $backup_dir_name 

  echo $fs_backup_name
  docker run -v audius-creator-node_file_storage:/volume \
    --rm audius-backup-container backup -> $fs_backup_name
  mv $fs_backup_name $backup_dir_name 

  echo $pg_backup_name
  docker run -v audius-creator-node_postgres_data:/volume \
    --rm audius-backup-container backup -> $pg_backup_name
  mv $pg_backup_name $backup_dir_name
}

backup $1
exit
