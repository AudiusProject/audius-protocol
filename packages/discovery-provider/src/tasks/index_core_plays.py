import logging

from sqlalchemy.orm.session import Session

from src.tasks.core.core_client import CoreClient
from src.tasks.core.gen.protocol_pb2 import SignedTransaction

logger = logging.getLogger(__name__)


def index_core_play(session: Session, core: CoreClient, tx: SignedTransaction):
    """Indexes a core play."""
    logger.debug("index_core_plays.py | got play")
