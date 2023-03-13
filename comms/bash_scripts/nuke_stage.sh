#!/bin/bash
# set -e

for val in discovery-1 discovery-2 discovery-3 discovery-4 discovery-5; do
  echo "stage-$val"
  ssh stage-$val 'bash -s' < bash_scripts/nuke_server.sh
done

for val in creator-5 creator-6 creator-7 creator-8 creator-9 creator-10 creator-11 user-metadata; do
  echo "stage-$val"
  ssh stage-$val 'bash -s' < bash_scripts/nuke_server.sh
done
