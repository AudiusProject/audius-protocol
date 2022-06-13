#!/bin/bash
set -e

# Audius Discovery Provider / Flask
# Exports environment variables necessary for Flask app

# app entry point module
export FLASK_APP=src.app
# enables flask development environment, including interactive debugger and reloader
# - (http://flask.pocoo.org/docs/1.0/server/)
export FLASK_ENV=development

exec flask run --host=0.0.0.0

