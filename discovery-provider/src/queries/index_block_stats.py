import logging

from flask import Blueprint
from src.api_helpers import success_response
from src.utils import redis_connection
from src.utils.index_blocks_performance import (
    get_add_indexed_block_to_db_ms_stats_since,
    get_fetch_ipfs_metadata_ms_stats_since,
    get_index_blocks_ms_stats_since,
)

MINUTE_IN_SECONDS = 60
TEN_MINUTES_IN_SECONDS = 60 * 10
HOUR_IN_SECONDS = 60 * 60
SIX_HOURS_IN_SECONDS = 6 * 60 * 60
TWELVE_HOURS_IN_SECONDS = 12 * 60 * 60
DAY_IN_SECONDS = 24 * 60 * 60

logger = logging.getLogger(__name__)

bp = Blueprint("index_block_stats", __name__)


@bp.route("/index_block_stats", methods=["GET"])
def index_block_stats():
    redis = redis_connection.get_redis()

    results = {
        "index_blocks_ms": {
            "minute": get_index_blocks_ms_stats_since(redis, MINUTE_IN_SECONDS),
            "ten_minutes": get_index_blocks_ms_stats_since(
                redis, TEN_MINUTES_IN_SECONDS
            ),
            "hour": get_index_blocks_ms_stats_since(redis, HOUR_IN_SECONDS),
            "six_hour": get_index_blocks_ms_stats_since(redis, SIX_HOURS_IN_SECONDS),
            "twelve_hour": get_index_blocks_ms_stats_since(
                redis, TWELVE_HOURS_IN_SECONDS
            ),
            "day": get_index_blocks_ms_stats_since(redis, DAY_IN_SECONDS),
        },
        "fetch_ipfs_metadata_ms": {
            "minute": get_fetch_ipfs_metadata_ms_stats_since(redis, MINUTE_IN_SECONDS),
            "ten_minutes": get_fetch_ipfs_metadata_ms_stats_since(
                redis, TEN_MINUTES_IN_SECONDS
            ),
            "hour": get_fetch_ipfs_metadata_ms_stats_since(redis, HOUR_IN_SECONDS),
            "six_hour": get_fetch_ipfs_metadata_ms_stats_since(
                redis, SIX_HOURS_IN_SECONDS
            ),
            "twelve_hour": get_fetch_ipfs_metadata_ms_stats_since(
                redis, TWELVE_HOURS_IN_SECONDS
            ),
            "day": get_fetch_ipfs_metadata_ms_stats_since(redis, DAY_IN_SECONDS),
        },
        "add_indexed_block_to_db_ms": {
            "minute": get_add_indexed_block_to_db_ms_stats_since(
                redis, MINUTE_IN_SECONDS
            ),
            "ten_minutes": get_add_indexed_block_to_db_ms_stats_since(
                redis, TEN_MINUTES_IN_SECONDS
            ),
            "hour": get_add_indexed_block_to_db_ms_stats_since(redis, HOUR_IN_SECONDS),
            "six_hour": get_add_indexed_block_to_db_ms_stats_since(
                redis, SIX_HOURS_IN_SECONDS
            ),
            "twelve_hour": get_add_indexed_block_to_db_ms_stats_since(
                redis, TWELVE_HOURS_IN_SECONDS
            ),
            "day": get_add_indexed_block_to_db_ms_stats_since(redis, DAY_IN_SECONDS),
        },
    }

    return success_response(results, sign_response=False)
