#!/bin/bash

# Audius Discovery Provider / Gunicorn

# run with gunicorn web server in prod for greater performance and robustness
#   "-b :5000" accept requests on port 5000
#   "--access-logfile - --error-logfile" - log to stdout/stderr
#   "src.wsgi:app" - app entry point in format: $(MODULE_NAME):$(VARIABLE_NAME)

# Use specified number of workers if present
if [[ -z "${audius_gunicorn_workers}" ]]
then
  WORKERS=2
else
  WORKERS="${audius_gunicorn_workers}"
fi

# Use specified number of threads if present (only used for "sync" workers)
if [[ -z "${audius_gunicorn_threads}" ]]
then
  THREADS=8
else
  THREADS="${audius_gunicorn_threads}"
fi

# run db migrations
if [ "$audius_db_run_migrations" != false ] ; then
  echo "Running alembic migrations"
  export PYTHONPATH='.'
  alembic upgrade head
  echo "Finished running migrations"
fi

# If a worker class is specified, use that. Otherwise, use sync workers.
if [[ -z "${audius_gunicorn_worker_class}" ]]
then
  exec gunicorn -b :5000 --access-logfile - --error-logfile - src.wsgi:app --log-level=debug --workers=$WORKERS --threads=$THREADS
else
  WORKER_CLASS="${audius_gunicorn_worker_class}"
  exec gunicorn -b :5000 --access-logfile - --error-logfile - src.wsgi:app --log-level=debug --worker-class=$WORKER_CLASS --workers=$WORKERS
fi