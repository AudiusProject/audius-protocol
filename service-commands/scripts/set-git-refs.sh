#!/usr/bin/env bash

set -ex

cd $PROTOCOL_DIR
git fetch origin
git checkout $1
git pull

if [[ -d $PROTOCOL_DIR/../audius-client ]]; then
	cd $PROTOCOL_DIR/../audius-client
	git fetch origin
	git checkout $2
	git pull
fi
