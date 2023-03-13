#!/bin/bash
# set -e

for val in discovery-4 discovery-1 discovery-2 discovery-3; do
  echo "prod-$val"
  ssh prod-$val 'bash -s' < bash_scripts/nuke_server.sh
done

for val in user-metadata creator-1 creator-2 creator-3 creator-5; do
  echo "prod-$val"
  ssh prod-$val 'bash -s' < bash_scripts/nuke_server.sh
done
