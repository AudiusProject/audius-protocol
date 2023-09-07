#! /bin/bash

assert_dir_exists() {
  local dir="$1"
  if [ -d "$dir" ]; then
    return
  else
    echo "$dir does not exist.\n export PROTOCOL_DIR=<path-to-audius-protocol>"
    exit 1
  fi
}

assert_dir_exists "$PROTOCOL_DIR/libs"

cd $PROTOCOL_DIR/libs
npm link
cd -

concurrently \
  "cd packages/common && npm link @audius/sdk" \
  "cd apps/web && npm link @audius/sdk" \
  "cd apps/mobile && npm link @audius/sdk" \