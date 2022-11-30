import logging
from typing import Optional

from redis import Redis
from sqlalchemy.orm.session import Session
from src.challenges.challenge_event_bus import ChallengeEventBus
from src.models.indexing.block import Block
from src.models.social.follow import Follow
from src.models.social.repost import Repost
from src.models.social.save import Save
from src.tasks.celery_app import celery
from src.tasks.social_features import (
    dispatch_challenge_follow,
    dispatch_challenge_repost,
)
from src.tasks.user_library import dispatch_favorite
from src.utils.config import shared_config
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


def enqueue_social_rewards_check(db: SessionManager, challenge_bus: ChallengeEventBus):
    with db.scoped_session() as session:
        block_backfill = get_latest_backfill(session)
        if block_backfill is None:
            logger.info(
                "index_profile_challenge_backfill.py | Exit early from backfill"
            )
            return
        # Do it
        max_blocknumber_seen = block_backfill
        # reposts of tracks and playlists reposts
        reposts = (
            session.query(Repost)
            .filter(
                Repost.blocknumber <= block_backfill,
                Repost.blocknumber > block_backfill - BLOCK_INTERVAL,
            )
            .all()
        )
        for repost in reposts:
            repost_blocknumber: int = repost.blocknumber
            dispatch_challenge_repost(challenge_bus, repost, repost_blocknumber)
            max_blocknumber_seen = max(repost_blocknumber, max_blocknumber_seen)

        saves = (
            session.query(Save)
            .filter(
                Save.blocknumber <= block_backfill,
                Save.blocknumber > block_backfill - BLOCK_INTERVAL,
            )
            .all()
        )
        for save in saves:
            save_blocknumber: int = save.blocknumber
            dispatch_favorite(challenge_bus, save, save_blocknumber)
            max_blocknumber_seen = max(save_blocknumber, max_blocknumber_seen)

        follows = (
            session.query(Follow)
            .filter(
                Follow.blocknumber <= block_backfill,
                Follow.blocknumber > block_backfill - BLOCK_INTERVAL,
            )
            .all()
        )
        for follow in follows:
            follow_blocknumber: int = follow.blocknumber
            dispatch_challenge_follow(challenge_bus, follow, follow_blocknumber)
            max_blocknumber_seen = max(follow_blocknumber, max_blocknumber_seen)

        save_indexed_checkpoint(
            session, index_profile_challenge_backfill_tablename, max_blocknumber_seen
        )


def get_latest_backfill(session: Session) -> Optional[int]:
    try:
        checkpoint = get_last_indexed_checkpoint(
            session, index_profile_challenge_backfill_tablename
        )
        BACKFILL_SOCIAL_REWARDS_BLOCKNUMBER = (
            shared_config["discprov"]["backfill_social_rewards_blocknumber"]
            if "backfill_social_rewards_blocknumber" in shared_config["discprov"]
            else None
        )
        # If the checkpoints is not set, start from the current blocknumber
        if checkpoint == 0:
            block = session.query(Block).filter(Block.is_current == True).first()
            if not block:
                return None
            block_number = block.number
            return block_number

        # check config for value
        if not BACKFILL_SOCIAL_REWARDS_BLOCKNUMBER:
            logger.info("index_profile_challenge_backfill.py | block number not set")
            return None

        if checkpoint <= BACKFILL_SOCIAL_REWARDS_BLOCKNUMBER:
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
    redis: Redis = index_profile_challenge_backfill.redis
    db: SessionManager = index_profile_challenge_backfill.db
    challenge_bus: ChallengeEventBus = (
        index_profile_challenge_backfill.challenge_event_bus
    )

    # Define lock acquired boolean
    have_lock = False
    # Max duration of lock is 1 hr
    update_lock = redis.lock("profile_challenge_backfill_lock", timeout=3600)

    try:
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            logger.info("index_profile_challenge_backfill.py | Acquired lock")
            enqueue_social_rewards_check(db, challenge_bus)
        else:
            logger.info("index_profile_challenge_backfill.py | Failed to acquire lock")
    except Exception as e:
        logger.error(
            "index_profile_challenge_backfill.py | Fatal error in main loop",
            exc_info=True,
        )
        raise e
    finally:
        if have_lock:
            update_lock.release()
