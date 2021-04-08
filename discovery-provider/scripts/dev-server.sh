#!/bin/bash

# Audius Discovery Provider / Flask
# Exports environment variables necessary for Flask app

# app entry point module
export FLASK_APP=src
# enables flask development environment, including interactive debugger and reloader
# - (http://flask.pocoo.org/docs/1.0/server/)
export FLASK_ENV=development

# run db migrations
if [ "$audius_db_run_migrations" != false ] ; then
  echo "running alembic migrations"
  export PYTHONPATH='.'
  alembic upgrade head
fi

exec flask run --host=0.0.0.0

