#!/bin/bash

mkdir /run/postgresql /db
chown -R postgres:postgres /run/postgresql /db
chmod 700 /db
