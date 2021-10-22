import logging
import datetime
from sqlalchemy import desc, func
from src import exceptions
from src.models import Play
from src.utils import helpers
from src.utils.db_session import get_db_read_replica
from src.queries.query_helpers import get_track_play_counts
from src.utils.redis_cache import get_pickled_key
from src.utils.redis_constants import latest_sol_play_tx_key

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

# Get last x sol specific plays
def get_latest_sol_plays(limit=10):
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

# Retrieve sol plays health object
def get_sol_play_health_info(limit, redis):
    # Query latest dplays
    latest_db_sol_plays = get_latest_sol_plays(limit)
    latest_cached_sol_tx = get_pickled_key(redis, latest_sol_play_tx_key)
    slot_diff = latest_cached_sol_tx["slot"] - latest_db_sol_plays[0]["slot"]
    time_diff = 0
    if latest_db_sol_plays:
        last_created_at_time = latest_db_sol_plays[0]["created_at"]
        current_time_utc = datetime.datetime.utcnow()
        time_diff = (current_time_utc - last_created_at_time).total_seconds()
    return {
        "slot_diff": slot_diff,
        "chain_tx": latest_cached_sol_tx,
        "db_info": latest_db_sol_plays,
        "time_diff": time_diff
    }
