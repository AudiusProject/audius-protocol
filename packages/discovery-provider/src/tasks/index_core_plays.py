import logging
import time
from datetime import datetime
from typing import List, TypedDict

from sqlalchemy.orm.session import Session

from src.challenges.challenge_event import ChallengeEvent
from src.challenges.challenge_event_bus import ChallengeEventBus
from src.models.social.play import Play
from src.tasks.core.core_client import CoreClient
from src.tasks.core.gen.protocol_pb2 import BlockResponse, SignedTransaction
from src.tasks.index_core_cutovers import get_adjusted_core_block

logger = logging.getLogger(__name__)


class PlayInfo(TypedDict):
    user_id: int | None
    play_item_id: int
    created_at: datetime
    updated_at: datetime
    source: str
    city: str
    region: str
    country: str
    slot: int
    signature: str


class PlayChallengeInfo(TypedDict):
    user_id: int
    created_at: datetime
    slot: int


def index_core_play(
    session: Session,
    core: CoreClient,
    challenge_bus: ChallengeEventBus,
    block: BlockResponse,
    tx: SignedTransaction,
):
    """Indexes a core play."""
    # TODO: validate signature

    logger.debug("index_core_plays.py | got play")
    plays: List[PlayInfo] = []
    challenge_bus_events: List[PlayChallengeInfo] = []

    tx_plays = tx.plays

    for tx_play in tx_plays.plays:
        user_id = None
        try:
            user_id = int(tx_play.user_id)
        except ValueError:
            log = ("Recording anonymous listen {!r}".format(tx_play.user_id),)
            logger.debug(
                log,
                exc_info=False,
            )

        signature = tx_play.signature
        timestamp = tx_play.timestamp.ToDatetime()
        track_id = int(tx_play.track_id)
        user_id = user_id
        slot = get_adjusted_core_block(block.height)

        plays.append(
            {
                "user_id": user_id,
                "play_item_id": track_id,
                "updated_at": datetime.now(),
                "slot": slot,
                "signature": signature,
                "created_at": timestamp,
                "source": "",
                "city": "",
                "region": "",
                "country": "",
            }
        )

        # Only enqueue a challenge event if it's *not*
        # an anonymous listen
        if user_id is not None:
            challenge_bus_events.append(
                {
                    "slot": slot,
                    "user_id": user_id,
                    "created_at": timestamp,
                }
            )

    if not plays:
        return

    session.execute(Play.__table__.insert().values(plays))
    logger.debug("index_core_plays.py | Dispatching listen events")
    listen_dispatch_start = time.time()
    for event in challenge_bus_events:
        challenge_bus.dispatch(
            ChallengeEvent.track_listen,
            event["slot"],
            event["created_at"],
            event["user_id"],
            {"created_at": event.get("created_at")},
        )
    listen_dispatch_end = time.time()
    listen_dispatch_diff = listen_dispatch_end - listen_dispatch_start
    logger.debug(
        f"index_core_plays.py | Dispatched listen events in {listen_dispatch_diff}"
    )
