#!/bin/bash

# Audius Discovery Provider / Gunicorn

# run with gunicorn web server in prod for greater performance and robustness
#   "-b :5000" accept requests on port 5000
#   "--access-logfile - --error-logfile" - log to stdout/stderr
#   "src.wsgi:app" - app entry point in format: $(MODULE_NAME):$(VARIABLE_NAME)
exec gunicorn -b :5000 --access-logfile - --error-logfile - src.wsgi:app --log-level=debug --worker-class eventlet --workers 9

