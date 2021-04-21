# exposes flask create_app() function as gunicorn entrypoint
import logging

from src.app import create_app

logger = logging.getLogger(__name__)

app = create_app()
logger.info('Web server initialized!')
