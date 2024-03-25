import datetime
import logging
import os
import time
from typing import Optional

from sqlalchemy.orm.session import Session

from src.challenges.challenge_event import ChallengeEvent
from src.challenges.challenge_event_bus import ChallengeEventBus
from src.models.indexing.block import Block
from src.models.social.follow import Follow
from src.models.social.repost import Repost
from src.models.social.save import Save
from src.tasks.celery_app import celery
from src.utils.prometheus_metric import save_duration_metric
from src.utils.session_manager import SessionManager
from src.utils.update_indexing_checkpoints import (
    get_last_indexed_checkpoint,
    save_indexed_checkpoint,
)

logger = logging.getLogger(__name__)

index_profile_challenge_backfill_tablename = "index_profile_challenge_backfill"

# Number of blocks to scan through at a time
BLOCK_INTERVAL = 1000


def dispatch_challenge_repost(bus: ChallengeEventBus, repost, block_number):
    bus.dispatch(ChallengeEvent.repost, block_number, repost.user_id)


def dispatch_challenge_follow(bus: ChallengeEventBus, follow, block_number):
    bus.dispatch(ChallengeEvent.follow, block_number, follow.follower_user_id)


def dispatch_favorite(bus: ChallengeEventBus, save, block_number):
    bus.dispatch(ChallengeEvent.favorite, block_number, save.user_id)


def enqueue_social_rewards_check(db: SessionManager, challenge_bus: ChallengeEventBus):
    with db.scoped_session() as session:
        backfill_blocknumber = get_config_backfill()
        # check config for value
        if backfill_blocknumber == None:
            logger.info(
                "index_profile_challenge_backfill.py | backfill block number not set"
            )
            return None
        backfill_blocknumber = int(backfill_blocknumber)
        block_backfill = get_latest_backfill(session, backfill_blocknumber)
        if block_backfill is None:
            logger.info("index_profile_challenge_backfill.py | Backfill complete")
            return
        # Do it
        min_blocknumber = block_backfill - BLOCK_INTERVAL
        # reposts of tracks and playlists reposts
        reposts = (
            session.query(Repost)
            .filter(
                Repost.blocknumber <= block_backfill,
                Repost.blocknumber > min_blocknumber,
            )
            .all()
        )
        logger.info(
            f"index_profile_challenge_backfill.py | calculated {len(reposts)} reposts"
        )
        for repost in reposts:
            repost_blocknumber: int = repost.blocknumber
            dispatch_challenge_repost(challenge_bus, repost, repost_blocknumber)

        saves = (
            session.query(Save)
            .filter(
                Save.blocknumber <= block_backfill,
                Save.blocknumber > min_blocknumber,
            )
            .all()
        )
        logger.info(
            f"index_profile_challenge_backfill.py | calculated {len(saves)} saves"
        )
        for save in saves:
            save_blocknumber: int = save.blocknumber
            dispatch_favorite(challenge_bus, save, save_blocknumber)

        follows = (
            session.query(Follow)
            .filter(
                Follow.blocknumber <= block_backfill,
                Follow.blocknumber > min_blocknumber,
            )
            .all()
        )
        logger.info(
            f"index_profile_challenge_backfill.py | calculated {len(follows)} follows"
        )
        for follow in follows:
            follow_blocknumber: int = follow.blocknumber
            dispatch_challenge_follow(challenge_bus, follow, follow_blocknumber)

        save_indexed_checkpoint(
            session, index_profile_challenge_backfill_tablename, min_blocknumber
        )


def get_config_backfill():
    return os.getenv("audius_discprov_backfill_social_rewards_blocknumber")


def get_latest_backfill(session: Session, backfill_blocknumber: int) -> Optional[int]:
    try:
        checkpoint = get_last_indexed_checkpoint(
            session, index_profile_challenge_backfill_tablename
        )
        # If the checkpoints is not set, start from the current blocknumber
        if checkpoint == 0:
            block = session.query(Block).filter(Block.is_current == True).first()
            if not block:
                return None
            block_number = block.number
            return block_number

        if checkpoint <= backfill_blocknumber:
            logger.info("index_profile_challenge_backfill.py | backfill complete")
            return None

        return checkpoint

    except Exception as e:
        logger.error(
            "index_profile_challenge_backfill.py | Error during get_latest_backfill",
            exc_info=True,
        )
        raise e


# ####### CELERY TASKS ####### #
@celery.task(name="index_profile_challenge_backfill", bind=True)
@save_duration_metric(metric_group="celery_task")
def index_profile_challenge_backfill(self):
    db: SessionManager = index_profile_challenge_backfill.db
    challenge_bus: ChallengeEventBus = (
        index_profile_challenge_backfill.challenge_event_bus
    )
    interval = datetime.timedelta(minute=1)
    start_time = time.time()
    errored = False
    try:
        logger.info("index_profile_challenge_backfill.py | Acquired lock")
        with challenge_bus.use_scoped_dispatch_queue():
            enqueue_social_rewards_check(db, challenge_bus)
    except Exception as e:
        logger.error(f"{self.name}.py | Fatal error in main loop", exc_info=True)
        errored = True
        raise e
    finally:
        end_time = time.time()
        elapsed = end_time - start_time
        time_left = max(0, interval.total_seconds() - elapsed)
        logger.info(
            {
                "task_name": self.name,
                "elapsed": elapsed,
                "interval": interval.total_seconds(),
                "time_left": time_left,
                "errored": errored,
            },
        )
        celery.send_task(self.name, countdown=time_left)
