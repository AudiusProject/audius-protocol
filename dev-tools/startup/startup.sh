#!/usr/bin/env sh

# NOTE: This scirpt is meant to be used from within docker containers

name=$(nslookup $(hostname -i) | grep -o "\(creator-node\|discovery-provider\|identity-service\)-[0-9]\+")
replica=$(echo $name | grep -o "[0-9]\+")

if [[ -f "/tmp/dev-tools/startup/${name%-*}.sh" ]]; then
  echo "Loading ${name%-*}.sh"
  . "/tmp/dev-tools/startup/${name%-*}.sh"
fi

if [[ -f "/tmp/dev-tools/startup/$name.sh" ]]; then
  echo "Loading $name.sh"
  . "/tmp/dev-tools/startup/$name.sh"
fi