#!/bin/bash
set -e

# UNCOMMENT for running with elasticsearch
# export audius_elasticsearch_url=http://elasticsearch:9200
# export audius_elasticsearch_run_indexer=true

# start es-indexer
if [[ "$audius_elasticsearch_url" ]] && [[ "$audius_elasticsearch_run_indexer" ]]; then
    cd es-indexer && npm i && npm start &
fi

# Audius Discovery Provider / Flask
# Exports environment variables necessary for Flask app

# app entry point module
export FLASK_APP=src.app
# enables flask development environment, including interactive debugger and reloader
# - (http://flask.pocoo.org/docs/1.0/server/)
export FLASK_ENV=development

exec flask run --host=0.0.0.0

