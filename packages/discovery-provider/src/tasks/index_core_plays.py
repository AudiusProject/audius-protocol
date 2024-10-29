import logging
from datetime import datetime
from typing import List

from sqlalchemy.orm.session import Session

from src.models.social.play import Play
from src.tasks.core.core_client import CoreClient
from src.tasks.core.gen.protocol_pb2 import SignedTransaction
from src.tasks.index_solana_plays import PlayInfo

logger = logging.getLogger(__name__)


def index_core_play(session: Session, core: CoreClient, tx: SignedTransaction):
    """Indexes a core play."""
    # TODO: validate signature

    logger.debug("index_core_plays.py | got play")
    plays: List[PlayInfo] = []

    tx_plays = tx.plays
    for tx_play in tx_plays.plays:
        signature = tx_play.signature
        # timestamp = tx_play.timestamp
        track_id = tx_play.track_id
        user_id = tx_play.user_id
        # need other fields

        # TODO: add relevant location data
        plays.append(
            {
                "user_id": user_id,
                "play_item_id": track_id,
                "updated_at": datetime.now(),
                "slot": 0,  # comet block + last solana slot?
                "signature": signature,
            }
        )

        # TODO: enqueue challenge events

    if not plays:
        return

    session.execute(Play.__table__.insert().values(plays))

    # TODO: dispatch other challenges
