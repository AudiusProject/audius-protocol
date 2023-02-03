#!/bin/bash
# set -e

for val in 1 2 3 5; do
  echo "DN $val"
  ssh stage-discovery-$val 'bash -s' < bash_scripts/nuke_server.sh
done


for val in 5 6 7 8 9 10 11; do
  echo "CN $val"
  ssh stage-creator-$val 'bash -s' < bash_scripts/nuke_server.sh
done
