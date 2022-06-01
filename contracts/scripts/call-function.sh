#!/usr/bin/env bash

set -o xtrace
set -e

# Usage: call-function.sh contractName functionName

node_modules/.bin/truffle console <<EOF
  $1.deployed().then((instance) => instance.$2.call()).then((value) => console.log("Function returned: " + value))
EOF
