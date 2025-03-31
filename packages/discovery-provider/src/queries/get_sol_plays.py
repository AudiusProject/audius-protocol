import logging
from datetime import datetime
from typing import List, Optional, TypedDict

from redis import Redis
from sqlalchemy import desc, func

from src import exceptions
from src.models.social.play import Play
from src.queries.sol_play_helpers import get_sum_aggregate_plays, get_track_play_counts
from src.utils import helpers
from src.utils.cache_solana_program import CachedProgramTxInfo, get_cached_sol_tx
from src.utils.db_session import get_db_read_replica
from src.utils.redis_constants import (
    latest_sol_play_db_tx_key,
    latest_sol_play_program_tx_key,
)

logger = logging.getLogger(__name__)


# Get single play from table
def get_sol_play(sol_tx_signature):
    if not sol_tx_signature:
        raise exceptions.ArgumentError("Missing tx signature")

    db = get_db_read_replica()
    sol_play = None
    with db.scoped_session() as session:
        base_query = session.query(Play).filter(Play.signature == sol_tx_signature)
        query_results = base_query.first()
        if query_results:
            sol_play = helpers.model_to_dictionary(query_results)

    return sol_play


class PlayDict(TypedDict):
    id: int
    user_id: int
    source: Optional[str]
    play_item_id: int
    slot: Optional[int]
    signature: Optional[str]
    created_at: datetime
    updated_at: datetime


# Get last x sol specific plays
def get_latest_sol_plays(limit=10) -> Optional[List[PlayDict]]:
    db = get_db_read_replica()

    # Cap max returned db entries
    limit = min(limit, 100)

    sol_plays = None
    with db.scoped_session() as session:
        base_query = (
            session.query(Play)
            .order_by(desc(Play.slot))
            .filter(Play.slot != None)
            .limit(limit)
        )
        query_results = base_query.all()
        if query_results:
            sol_plays = helpers.query_result_to_list(query_results)

    return sol_plays


# For the n most recently listened to tracks, return the all time listen counts for those tracks
def get_track_listen_milestones(limit=100):
    db = get_db_read_replica()

    with db.scoped_session() as session:
        results = (
            session.query(
                Play.play_item_id.distinct().label("play_item_id"),
                func.max(Play.created_at).label("max"),
            )
            .group_by(Play.play_item_id)
            .order_by(desc("max"))
            .limit(limit)
            .all()
        )

        track_ids = [result[0] for result in results]
        track_id_play_counts = get_track_play_counts(session, track_ids)

    return track_id_play_counts


# Get total play count from aggregate plays
def get_total_aggregate_plays():
    db = get_db_read_replica()

    with db.scoped_session() as session:
        total_aggregate_plays = get_sum_aggregate_plays(session)
    return total_aggregate_plays


# Retrieve the latest stored value in database for sol plays
# Cached during processing of plays
def get_latest_cached_sol_play_db(redis) -> CachedProgramTxInfo:
    latest_sol_play_db = get_cached_sol_tx(redis, latest_sol_play_db_tx_key)
    plays_from_db = None
    if not latest_sol_play_db:
        # If nothing found in cache, pull from db
        plays_from_db = get_latest_sol_plays(1)
        latest_sol_play = plays_from_db[0] if plays_from_db else None
        if latest_sol_play:
            latest_sol_play_db = {
                "signature": latest_sol_play.get("signature"),
                "slot": latest_sol_play.get("slot"),
                "timestamp": int(
                    latest_sol_play["created_at"].timestamp()  # pylint: disable=E1136
                ),
            }
    return latest_sol_play_db


def get_latest_cached_sol_play_program_tx(redis) -> CachedProgramTxInfo:
    # Latest play tx from chain
    latest_sol_play_program_tx = get_cached_sol_tx(
        redis, latest_sol_play_program_tx_key
    )
    return latest_sol_play_program_tx


# Retrieve sol plays health object
def get_sol_play_health_info(redis: Redis, current_time_utc: datetime):
    # Query latest plays information
    # Latest play tx committed to DB
    latest_sol_play_db = get_latest_cached_sol_play_db(redis)

    # Latest play tx from chain
    latest_sol_play_program_tx = get_cached_sol_tx(
        redis, latest_sol_play_program_tx_key
    )
    time_diff = -1.0
    slot_diff = -1

    if latest_sol_play_db and latest_sol_play_program_tx:
        slot_diff = latest_sol_play_program_tx["slot"] - latest_sol_play_db["slot"]
        last_created_at_time = datetime.utcfromtimestamp(
            latest_sol_play_db["timestamp"]
        )
        time_diff = (current_time_utc - last_created_at_time).total_seconds()

    return_val = {
        "slot_diff": slot_diff,
        "tx_info": {
            "chain_tx": latest_sol_play_program_tx,
            "db_tx": latest_sol_play_db,
        },
        "time_diff": time_diff,
    }
    return return_val


def get_latest_sol_play_check_info(redis: Redis, limit: int):
    response = {}
    # Latest play information from chain
    latest_sol_play_program_tx = get_cached_sol_tx(
        redis, latest_sol_play_program_tx_key
    )
    latest_sol_play_db_tx = get_cached_sol_tx(redis, latest_sol_play_db_tx_key)
    response["latest_chain_tx"] = latest_sol_play_program_tx
    response["latest_db_tx"] = latest_sol_play_db_tx
    response["latest_db_sol_plays"] = get_latest_sol_plays(limit)
    return response
