#!/bin/bash

set -e
source ./bash_scripts/nodes.sh

make build.push.fast

for val in $stage_nodes_discovery; do
  echo "$val"
  ssh $val 'bash -s' < bash_scripts/deploy_discovery.sh a1
done
