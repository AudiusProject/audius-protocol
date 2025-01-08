import time
from datetime import datetime
from logging import LoggerAdapter
from typing import List, Optional, TypedDict

from sqlalchemy.orm.session import Session

from src.challenges.challenge_event import ChallengeEvent
from src.challenges.challenge_event_bus import ChallengeEventBus
from src.models.social.play import Play
from src.tasks.core.gen.protocol_pb2 import SignedTransaction


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


def index_core_plays(
    logger: LoggerAdapter,
    session: Session,
    challenge_bus: ChallengeEventBus,
    latest_indexed_slot: int,
    tx: SignedTransaction,
) -> Optional[int]:
    logger.info("indexing plays")

    next_slot = latest_indexed_slot + 1

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
        slot = next_slot
        city = tx_play.city
        region = tx_play.region
        country = tx_play.country

        plays.append(
            {
                "user_id": user_id,
                "play_item_id": track_id,
                "updated_at": datetime.now(),
                "slot": slot,
                "signature": signature,
                "created_at": timestamp,
                "source": "relay",
                "city": city,
                "region": region,
                "country": country,
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
        return None

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
    logger.debug(f"dispatched listen events in {listen_dispatch_diff}")

    return slot
