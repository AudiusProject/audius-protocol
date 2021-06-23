#!/bin/bash

mkdir /db
chown postgres:postgres /db
chmod 700 /db
sudo -u postgres initdb -D /db
