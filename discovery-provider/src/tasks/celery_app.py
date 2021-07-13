from __future__ import absolute_import
from celery import Celery

# Create the celery application
# Invoked by worker.py
celery = Celery(__name__)

# Celery removes all configured loggers. This setting prevents
# Celery from overriding the configured logger set in create_celery()
celery.conf.update({"worker_hijack_root_logger": False})
