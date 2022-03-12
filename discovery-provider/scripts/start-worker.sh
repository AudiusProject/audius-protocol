#!/bin/bash

export audius_prometheus_container=worker
rm -rf /${PROMETHEUS_MULTIPROC_DIR}/*${audius_prometheus_container}*

celery -A src.worker.celery worker --loglevel info
