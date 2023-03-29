#!/bin/bash

source ./bash_scripts/nodes.sh

if [ $env == "prod" ]; then
  echo "nuking prod... you have 10 seconds to abort"
  sleep 10;
fi

for val in $servers; do
  echo "$val"
  ssh $val 'bash -s' < bash_scripts/nuke_mediorum.sh
done
