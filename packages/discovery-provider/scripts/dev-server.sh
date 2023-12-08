#!/bin/bash
set -e

# Audius Discovery Provider / Flask
# Exports environment variables necessary for Flask app

# Flask uses presence of a .env to determine current directory if left unset
# https://github.com/pallets/flask/issues/3209
export FLASK_SKIP_DOTENV=1

# app entry point module
export FLASK_APP=src.app
# enables flask development environment, including interactive debugger and reloader
# - (http://flask.pocoo.org/docs/1.0/server/)
export FLASK_ENV=development

exec flask run --host=0.0.0.0

