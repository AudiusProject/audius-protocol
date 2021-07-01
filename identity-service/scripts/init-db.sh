#!/bin/bash

mkdir /run/postgresql /db
chown -R postgres:postgres /run/postgresql /db
chmod 700 /db

sudo -u postgres pg_ctl init -D /db

sudo -u postgres pg_ctl start -D /db
sudo -u postgres createdb audius_identity_service
sudo -u postgres pg_ctl stop -D /db
