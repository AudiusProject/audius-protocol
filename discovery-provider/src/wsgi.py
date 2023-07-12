# exposes flask create_app() function as gunicorn entrypoint
from os import getenv
from src.utils.structured_logger import StructuredLogger
from src.app import create_app

logger = StructuredLogger(__name__)

app = create_app()

logger.set_context("GIT_SHA", getenv("GIT_SHA"))
logger.set_context("AUDIUS_DOCKER_COMPOSE_GIT_SHA", getenv("AUDIUS_DOCKER_COMPOSE_GIT_SHA"))
logger.info("Web server initialized!")
