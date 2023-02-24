#!/bin/bash

echo "Running alembic migrations"
export PYTHONPATH='.'
alembic upgrade head
echo "Finished running alembic migrations"
