#!/bin/bash

mkdir /db
chown postgres:postgres /db
chmod 700 /db
sudo -u postgres initdb -D /db

mkdir /run/postgresql
chown -R postgres:postgres /run/postgresql

sudo -u postgres postgres -D /db -h 127.0.0.1 &
postgresPid="$!"
export WAIT_HOSTS="localhost:5432"
/wait
sleep 60

sudo -u postgres createdb audius_discovery

kill $postgresPid
