import logging  # pylint: disable=C0302

from flask import Blueprint
from src import api_helpers
from src.utils import get_db, redis_connection
from src.aggregates.index_aggregate_track import (
    AGGREGATE_TRACK,
    _update_aggregate_track,
)

logger = logging.getLogger(__name__)
bp = Blueprint("notifications", __name__)


@bp.route("/load/task/<string:celery_task>", methods=("GET",))
def load_task(celery_task):

    db = get_db()
    redis = redis_connection.get_redis()

    if celery_task == "update_aggregate_track":
        try_updating_aggregate_table(
            logger, db, redis, AGGREGATE_TRACK, _update_aggregate_track
        )

    return api_helpers.success_response(True)
