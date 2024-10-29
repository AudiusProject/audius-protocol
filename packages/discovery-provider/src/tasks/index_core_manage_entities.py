import logging

from sqlalchemy.orm.session import Session

from src.tasks.core.core_client import CoreClient
from src.tasks.core.gen.protocol_pb2 import SignedTransaction

logger = logging.getLogger(__name__)


def index_core_manage_entity(session: Session, core: CoreClient, tx: SignedTransaction):
    """Indexes legacy core manage entities."""
    logger.debug(f"index_core_manage_entities.py | got manage entity {tx}")
