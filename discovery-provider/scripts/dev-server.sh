#!/bin/bash
set -e

if [ "$audius_db_run_migrations" != false ]; then
    echo "Running alembic migrations"
    export PYTHONPATH='.'
    alembic upgrade head
    echo "Finished running migrations"
fi

# run a script to ensure all indexes exist in the db
echo "Running db_index_checks"
python3 ./scripts/db_index_checks.py
echo "Finished db_index_checks"

# Audius Discovery Provider / Flask
# Exports environment variables necessary for Flask app

# app entry point module
export FLASK_APP=src.app
# enables flask development environment, including interactive debugger and reloader
# - (http://flask.pocoo.org/docs/1.0/server/)
export FLASK_ENV=development

exec flask run --host=0.0.0.0

