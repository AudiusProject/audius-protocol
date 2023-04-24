#!/bin/bash

set -e
source ./bash_scripts/nodes.sh

make build.fast

for val in $servers; do
  echo ""
  echo "=== $val ==="
  ssh "$val" 'bash -s' < bash_scripts/deploy_mediorum.sh
done
