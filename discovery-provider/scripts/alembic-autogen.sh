#!/bin/bash

if [ -z "$1" ]
then
  echo "Must pass in revision string - reference alembic documentation"
fi

set -e
set -o xtrace

alembic revision --autogenerate -m "$1"
