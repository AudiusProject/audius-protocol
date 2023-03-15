#!/bin/bash

set -e
source ./bash_scripts/nodes.sh

make build.push.fast

for val in $prod_nodes_discovery; do
  echo "$val"
  ssh $val 'bash -s' < bash_scripts/deploy_discovery.sh a1
done

for val in $prod_nodes_content; do
  echo "$val"
  ssh $val 'bash -s' < bash_scripts/deploy_content.sh a1
done
