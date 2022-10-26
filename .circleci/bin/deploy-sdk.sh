#!/usr/bin/env bash

set -e

# cd into .circleci/
SCRIPTPATH="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"
cd ${SCRIPTPATH}/..

# always install deps
pip3 install -r triggers/requirements.txt &> /dev/null

# allow for relative imports
export PYTHONPATH=.

# pass all args to our deployment script
./triggers/deploy-sdk.py ${@}
