#!/bin/bash

set -e

cd /root/audius-docker-compose

if [ -f .venv/bin/activate ] || python3 -m venv .venv; then
  source .venv/bin/activate
fi

install_outfile="$(mktemp)"

if ! python3 -m pip install -r requirements.txt &> "$install_outfile"; then
  cat "$install_outfile" 1>&2
fi

rm "$install_outfile"

python3 ./audius-cli "$@"
