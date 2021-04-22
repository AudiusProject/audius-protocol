import logging
import sys

from src.app import create_celery

logger = logging.getLogger(__name__)

celery = create_celery()

# Celery instances are initialized via command line
# Grab the specific instance (beat or worker) and log it
logger.info(f'Celery {sys.argv[len(sys.argv)-1]} initialized!')
