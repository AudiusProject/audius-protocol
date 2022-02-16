# exposes flask create_app() function as gunicorn entrypoint
import logging
from os import getenv

from src.app import create_app

logger = logging.getLogger(__name__)

if not getenv("PROMETHEUS_MULTIPROC_DIR"):
    logger.error("PROMETHEUS_MULTIPROC_DIR is not set")
    exit(1)


def child_exit(server, worker):
    from prometheus_client import multiprocess

    multiprocess.mark_process_dead(worker.pid)


app = create_app()
logger.info("Web server initialized!")
