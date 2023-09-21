#!/bin/bash

adduser --disabled-password postgres

mkdir /run/postgresql /db
chown -R postgres:postgres /run/postgresql /db
chmod 700 /db
sudo -u postgres pg_ctl init -D /db
echo "host all all 0.0.0.0/0 md5" >>/db/pg_hba.conf
echo "listen_addresses = '*'" >>/db/postgresql.conf
sudo -u postgres pg_ctl start -D /db -o "-c shared_preload_libraries=pg_stat_statements"
sudo -u postgres createdb audius_discovery
sudo -u postgres pg_ctl stop -D /db
