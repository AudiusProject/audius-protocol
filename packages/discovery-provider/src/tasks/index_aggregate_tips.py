import itertools
import logging
import operator
from datetime import datetime, timezone
from typing import List, TypedDict

from redis import Redis
from sqlalchemy import text
from sqlalchemy.orm.session import Session

from src.models.users.supporter_rank_up import SupporterRankUp
from src.models.users.user_tip import UserTip
from src.tasks.aggregates import init_task_and_acquire_lock, update_aggregate_table
from src.tasks.celery_app import celery
from src.utils.prometheus_metric import save_duration_metric
from src.utils.redis_constants import redis_keys
from src.utils.session_manager import SessionManager
from src.utils.update_indexing_checkpoints import get_last_indexed_checkpoint

logger = logging.getLogger(__name__)


# How many users should be on the "leaderboard"
LEADERBOARD_SIZE = 5


# names of the aggregate tables to update
AGGREGATE_TIPS = "aggregate_user_tips"


UPDATE_AGGREGATE_USER_TIPS_QUERY = """
-- Update aggregate_tips table:
INSERT INTO aggregate_user_tips (
        sender_user_id
        , receiver_user_id
        , amount
    )
SELECT
    sender_user_id
    , receiver_user_id
    , SUM(amount) as amount
FROM user_tips
WHERE
    slot > :prev_slot AND
    slot <= :current_slot
GROUP BY
    sender_user_id
    , receiver_user_id
ON CONFLICT (sender_user_id, receiver_user_id)
DO UPDATE
    SET amount = EXCLUDED.amount + aggregate_user_tips.amount;

-- Update aggregate_user supporter/supporting counts:
WITH recent_tips AS (
    SELECT
            sender_user_id
            , receiver_user_id
    FROM user_tips
    WHERE
            slot > :prev_slot AND
            slot <= :current_slot
    GROUP BY
            sender_user_id
            , receiver_user_id
)
, user_ids AS (
    SELECT sender_user_id AS user_id FROM recent_tips
    UNION SELECT receiver_user_id AS user_id FROM recent_tips
), supporting AS (
    SELECT receiver_user_id AS user_id, COUNT(sender_user_id) AS total_supporting
    FROM aggregate_user_tips
    WHERE receiver_user_id IN (SELECT user_id FROM user_ids)
    GROUP BY receiver_user_id
), supporters AS (
    SELECT sender_user_id AS user_id, COUNT(receiver_user_id) AS total_supporters
    FROM aggregate_user_tips
    WHERE sender_user_id IN (SELECT user_id FROM user_ids)
    GROUP BY sender_user_id
)
INSERT INTO aggregate_user (
    user_id,
    track_count,
    playlist_count,
    album_count,
    follower_count,
    following_count,
    repost_count,
    track_save_count,
    supporter_count,
    supporting_count
)
SELECT
    user_ids.user_id,
    0 AS track_count,
    0 AS playlist_count,
    0 AS album_count, 0 AS follower_count,
    0 AS following_count,
    0 AS repost_count,
    0 AS track_save_count,
    COALESCE(total_supporting, 0) AS supporting_count,
    COALESCE(total_supporters, 0) AS supporter_count
FROM user_ids
FULL OUTER JOIN supporting ON supporting.user_id = user_ids.user_id
FULL OUTER JOIN supporters ON supporters.user_id = user_ids.user_id
ON CONFLICT (user_id)
DO
    UPDATE SET
        supporting_count = EXCLUDED.supporting_count,
        supporter_count = EXCLUDED.supporter_count
"""


GET_AGGREGATE_USER_TIPS_RANKS_QUERY = """
SELECT 
    rank
    , sender_user_id
    , receiver_user_id
    , amount
FROM (
    SELECT
        RANK() OVER (PARTITION BY receiver_user_id ORDER BY amount DESC) AS rank
        , sender_user_id
        , receiver_user_id
        , amount
    FROM aggregate_user_tips
    WHERE receiver_user_id IN (
        SELECT DISTINCT ON (receiver_user_id) receiver_user_id
        FROM user_tips
        WHERE
            slot > :prev_slot AND
            slot <= :current_slot
    )
) rankings
WHERE rank <= :leaderboard_size
"""


class AggregateTipRank(TypedDict):
    rank: int
    sender_user_id: int
    receiver_user_id: int
    amount: int


def _get_ranks(
    session: Session, prev_slot: int, current_slot: int
) -> List[AggregateTipRank]:
    return session.execute(
        text(
            GET_AGGREGATE_USER_TIPS_RANKS_QUERY,
        ),
        {
            "prev_slot": prev_slot,
            "current_slot": current_slot,
            "leaderboard_size": LEADERBOARD_SIZE,
        },
    ).fetchall()


def index_rank_ups(
    session: Session,
    ranks_before: List[AggregateTipRank],
    ranks_after: List[AggregateTipRank],
    slot: int,
):
    # Convert to a dict where { <receiver_user_id>: { <sender_user_id>: <rank> } }
    grouped_ranks_before = {
        key: {r["sender_user_id"]: r["rank"] for r in subiter}
        for key, subiter in itertools.groupby(
            ranks_before, operator.itemgetter("receiver_user_id")
        )
    }
    for row in ranks_after:
        if (
            # Receiver was not previously tipped
            row["receiver_user_id"] not in grouped_ranks_before
            # Sender was not previously on the leaderboard
            or row["sender_user_id"]
            not in grouped_ranks_before[row["receiver_user_id"]]
            # Sender moved up the leaderboard
            or row["rank"]
            < grouped_ranks_before[row["receiver_user_id"]][row["sender_user_id"]]
        ):
            rank_up = SupporterRankUp(
                slot=slot,
                sender_user_id=row["sender_user_id"],
                receiver_user_id=row["receiver_user_id"],
                rank=row["rank"],
            )
            session.add(rank_up)
            logger.debug(f"index_aggregate_tips.py | Rank Up: {rank_up}")


def _update_aggregate_tips(session: Session, redis: Redis):
    prev_slot = get_last_indexed_checkpoint(session, AGGREGATE_TIPS)
    max_slot_result = (
        session.query(UserTip.slot, UserTip.signature)
        .order_by(UserTip.slot.desc())
        .one()
    )
    (max_slot, last_tip_signature) = (
        max_slot_result if max_slot_result[0] is not None else (0, None)
    )

    ranks_before = _get_ranks(session, prev_slot, max_slot)
    update_aggregate_table(
        logger,
        session,
        AGGREGATE_TIPS,
        UPDATE_AGGREGATE_USER_TIPS_QUERY,
        "slot",
        max_slot,
    )
    ranks_after = _get_ranks(session, prev_slot, max_slot)
    index_rank_ups(session, ranks_before, ranks_after, max_slot)
    redis.set(redis_keys.solana.aggregate_tips.last_tx, last_tip_signature)
    redis.set(
        redis_keys.solana.aggregate_tips.last_completed_at,
        datetime.now(timezone.utc).timestamp(),
    )


# ####### CELERY TASKS ####### #
@celery.task(name="index_aggregate_tips", bind=True)
@save_duration_metric(metric_group="celery_task")
def update_aggregate_tips(self):
    # Cache custom task class properties
    # Details regarding custom task context can be found in wiki
    # Custom Task definition can be found in src/app.py
    db: SessionManager = update_aggregate_tips.db
    redis: Redis = update_aggregate_tips.redis

    init_task_and_acquire_lock(
        logger, db, redis, AGGREGATE_TIPS, _update_aggregate_tips
    )
