import logging
from datetime import datetime, timezone
from typing import Any, List, Tuple, TypedDict, Union

import requests
from src.models.indexing.ursm_content_node import UrsmContentNode
from src.models.tracks.track import Track
from src.models.users.user import User
from src.tasks.celery_app import celery
from src.utils.prometheus_metric import (
    PrometheusMetric,
    PrometheusMetricNames,
    save_duration_metric,
)
from src.utils.redis_constants import (
    ALL_UNAVAILABLE_TRACKS_REDIS_KEY,
    UPDATE_TRACK_IS_AVAILABLE_FINISH_REDIS_KEY,
    UPDATE_TRACK_IS_AVAILABLE_START_REDIS_KEY,
)

logger = logging.getLogger(__name__)

UPDATE_TRACK_IS_AVAILABLE_LOCK = "update_track_is_available_lock"

BATCH_SIZE = 1000
DEFAULT_LOCK_TIMEOUT_SECONDS = 30  # 30 seconds
REQUESTS_TIMEOUT_SECONDS = 300  # 5 minutes


class ContentNodeInfo(TypedDict):
    endpoint: str
    spID: int


def _get_redis_set_members_as_list(redis: Any, key: str) -> List[int]:
    """Fetches the unavailable track ids per Content Node"""
    values = redis.smembers(key)
    return [int(value.decode()) for value in values]


def fetch_unavailable_track_ids_in_network(session: Any, redis: Any) -> None:
    """Fetches the unavailable track ids in the Content Node network"""
    content_nodes = query_registered_content_node_info(session)

    # Clear redis for existing data
    redis.delete(ALL_UNAVAILABLE_TRACKS_REDIS_KEY)

    for node in content_nodes:
        # Keep mapping of spId to set of unavailable tracks
        unavailable_track_ids = fetch_unavailable_track_ids(node["endpoint"])
        spID_unavailable_tracks_key = get_unavailable_tracks_redis_key(node["spID"])

        # Clear redis for existing data
        redis.delete(spID_unavailable_tracks_key)

        for i in range(0, len(unavailable_track_ids), BATCH_SIZE):
            unavailable_track_ids_batch = unavailable_track_ids[i : i + BATCH_SIZE]
            redis.sadd(spID_unavailable_tracks_key, *unavailable_track_ids_batch)

            # Aggregate a set of unavailable tracks
            redis.sadd(ALL_UNAVAILABLE_TRACKS_REDIS_KEY, *unavailable_track_ids_batch)


def update_tracks_is_available_status(db: Any, redis: Any) -> None:
    """Check track availability on all unavailable tracks and update in Tracks table"""
    all_unavailable_track_ids = _get_redis_set_members_as_list(
        redis, ALL_UNAVAILABLE_TRACKS_REDIS_KEY
    )

    for i in range(0, len(all_unavailable_track_ids), BATCH_SIZE):
        unavailable_track_ids_batch = all_unavailable_track_ids[i : i + BATCH_SIZE]
        try:
            with db.scoped_session() as session:
                track_ids_to_replica_set = query_replica_set_by_track_id(
                    session, unavailable_track_ids_batch
                )

                track_id_to_is_available_status = {}

                for entry in track_ids_to_replica_set:
                    track_id = entry[0]

                    # Some users are do not have primary_ids or secondary_ids
                    # If these values are not null, check if track is available
                    # Else, default to track as available
                    if (
                        entry[1] is not None  # primary_id
                        and entry[2][0] is not None  # secondary_id 1
                        and entry[2][1] is not None  # secondary_id 2
                    ):

                        spID_replica_set = [entry[1], *entry[2]]
                        is_available = check_track_is_available(
                            redis=redis,
                            track_id=track_id,
                            spID_replica_set=spID_replica_set,
                        )
                    else:
                        is_available = True

                    track_id_to_is_available_status[track_id] = is_available

                # Update tracks with is_available status
                tracks = query_tracks_by_track_ids(session, unavailable_track_ids_batch)
                for track in tracks:
                    is_available = track_id_to_is_available_status[track.track_id]

                    # If track is not available, also flip 'is_delete' flag to True
                    if not is_available:
                        track.is_available = False
                        track.is_delete = True

        except Exception as e:
            logger.warn(
                f"update_track_is_available.py | Could not process batch {unavailable_track_ids_batch}: {e}\nContinuing..."
            )


def fetch_unavailable_track_ids(node: str) -> List[int]:
    """Fetches unavailable tracks from Content Node. Returns empty list if request fails"""
    unavailable_track_ids = []

    try:
        resp = requests.get(
            f"{node}/blacklist/tracks", timeout=REQUESTS_TIMEOUT_SECONDS
        ).json()
        unavailable_track_ids = resp["data"]["values"]
    except Exception as e:
        logger.warn(
            f"update_track_is_available.py | Could not fetch unavailable tracks from {node}: {e}"
        )

    return unavailable_track_ids


def query_replica_set_by_track_id(
    session: Any, track_ids: List[int]
) -> Union[List[Tuple[int, int, List[int]]], List[Tuple[int, None, List[None]]]]:
    """
    Returns an array of tuples with the structure: [(track_id | primary_id | secondary_ids), ...]
    If `primary_id` and `secondary_ids` are undefined, will return as None
    """
    track_ids_and_replica_sets = (
        session.query(Track.track_id, User.primary_id, User.secondary_ids)
        .join(User, Track.owner_id == User.user_id, isouter=True)  # left join
        .filter(
            User.is_current == True,
            Track.is_current == True,
            Track.track_id.in_(track_ids),
        )
        .all()
    )

    return track_ids_and_replica_sets


def query_tracks_by_track_ids(session: Any, track_ids: List[int]) -> List[Any]:
    """Returns a list of Track objects that has a track id in `track_ids`"""
    tracks = (
        session.query(Track)
        .filter(
            Track.is_current == True,
            Track.track_id.in_(track_ids),
        )
        .all()
    )

    return tracks


def query_registered_content_node_info(
    session: Any,
) -> List[ContentNodeInfo]:
    """Returns a list of all registered Content Node endpoint and spID"""
    registered_content_nodes = (
        session.query(UrsmContentNode.endpoint, UrsmContentNode.cnode_sp_id)
        .filter(
            UrsmContentNode.is_current == True,
        )
        .all()
    )

    def create_node_info_response(node):
        return {"endpoint": node[0], "spID": node[1]}

    return list(map(create_node_info_response, registered_content_nodes))


def check_track_is_available(
    redis: Any, track_id: int, spID_replica_set: List[int]
) -> bool:
    """
    Checks if a track is available in the replica set. Needs to only be available
    on one replica set node to be marked as available.
        redis: redis instance
        track_id: the observed track id
        spID_replica_set: an array of the SP IDs that are associated with track
    """

    i = 0
    while i < len(spID_replica_set):
        spID_unavailable_tracks_key = get_unavailable_tracks_redis_key(
            spID_replica_set[i]
        )
        is_available_on_sp = not redis.sismember(spID_unavailable_tracks_key, track_id)

        if is_available_on_sp:
            return True

        i = i + 1

    return False


def get_unavailable_tracks_redis_key(spID: int) -> str:
    """Returns the redis key used to store the unavailable tracks on a sp"""
    return f"update_track_is_available:unavailable_tracks_{spID}"


# ####### CELERY TASKS ####### #
@celery.task(name="update_track_is_available", bind=True)
@save_duration_metric(metric_group="celery_task")
def update_track_is_available(self) -> None:
    """Recurring task that updates whether tracks are available on the network"""

    db = update_track_is_available.db
    redis = update_track_is_available.redis

    have_lock = False
    update_lock = redis.lock(
        UPDATE_TRACK_IS_AVAILABLE_LOCK,
        timeout=DEFAULT_LOCK_TIMEOUT_SECONDS,
    )

    have_lock = update_lock.acquire(blocking=False)
    if have_lock:
        metric = PrometheusMetric(
            PrometheusMetricNames.UPDATE_TRACK_IS_AVAILABLE_DURATION_SECONDS
        )
        try:
            # TODO: we can deprecate this manual redis timestamp tracker once we confirm
            # that prometheus works in tracking duration. Needs to be removed from
            # the health check too
            redis.set(
                UPDATE_TRACK_IS_AVAILABLE_START_REDIS_KEY,
                datetime.now(tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S.%f %Z"),
            )

            with db.scoped_session() as session:
                fetch_unavailable_track_ids_in_network(session, redis)

            update_tracks_is_available_status(db, redis)

            metric.save_time({"success": "true"})
        except Exception as e:
            metric.save_time({"success": "false"})
            logger.error(
                "update_track_is_available.py | Fatal error in main loop", exc_info=True
            )
            raise e
        finally:
            # TODO: see comment above about deprecation
            redis.set(
                UPDATE_TRACK_IS_AVAILABLE_FINISH_REDIS_KEY,
                datetime.now(tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S.%f %Z"),
            )
            if have_lock:
                update_lock.release()
    else:
        logger.warning(
            "update_track_is_available.py | Lock not acquired",
            exc_info=True,
        )
