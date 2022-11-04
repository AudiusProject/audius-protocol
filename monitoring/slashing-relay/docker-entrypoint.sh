#!/usr/bin/env sh

cd ${WORKDIR}/audius-protocol
git pull

cd ${WORKDIR}
flask --app relay run --host=0.0.0.0