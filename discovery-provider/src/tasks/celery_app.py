from __future__ import absolute_import
from celery import Celery

# Create the celery application
# Invoked by worker.py
celery = Celery(__name__)
