#!/bin/bash
set -e

make build.fast

for val in 1 2 3 5; do
  echo "DN $val"
  ssh stage-discovery-$val 'bash -s' < bash_scripts/deploy_discovery.sh
done

for val in 5 6 7; do
  echo "CN $val"
  ssh stage-creator-$val 'bash -s' < bash_scripts/deploy_content.sh
done

for val in 8 9 10 11; do
  echo "CN $val"
  ssh stage-creator-$val 'bash -s' < bash_scripts/deploy_content.sh
done

