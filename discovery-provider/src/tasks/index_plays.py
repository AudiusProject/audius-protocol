import logging
import time
from urllib.parse import urljoin
from datetime import datetime
import requests
import dateutil.parser
from sqlalchemy import func, desc, or_, and_
from src.models import Play
from src.tasks.celery_app import celery
from src.utils.helpers import redis_set_and_dump
from src.utils.redis_constants import latest_legacy_play_db_key

logger = logging.getLogger(__name__)

# The number of listens to get per request to identity
REQUEST_LISTENS_LIMIT = 5000

# The name of the job to be printed w/ each log
JOB = "index-plays"


def get_time_diff(previous_time):
    # Returns the time difference in milliseconds
    return int((time.time() - previous_time) * 1000)


# Retrieve the play counts from the identity service
# NOTE: indexing the plays will eventually be a part of `index_blocks`


def get_track_plays(self, db, lock, redis):
    start_time = time.time()
    job_extra_info = {"job": JOB}
    with db.scoped_session() as session:
        # Get the most retrieved play date in the db to use as an offet for fetching
        # more play counts from identity
        most_recent_play_date = (
            session.query(Play.updated_at)
            .filter(Play.signature == None)
            .order_by(desc(Play.updated_at), desc(Play.id))
            .first()
        )
        if most_recent_play_date == None:
            # Make the date way back in the past to get the first play count onwards
            most_recent_play_date = datetime(2000, 1, 1, 0, 0).timestamp()
        else:
            most_recent_play_date = most_recent_play_date[0].timestamp()

        job_extra_info["most_recent_play_date"] = get_time_diff(start_time)

        # Create and query identity service endpoint for track play counts
        identity_url = update_play_count.shared_config["discprov"][
            "identity_service_url"
        ]
        params = {"startTime": most_recent_play_date, "limit": REQUEST_LISTENS_LIMIT}
        identity_tracks_endpoint = urljoin(identity_url, "listens/bulk")

        track_listens = {}
        try:
            identity_response_time = time.time()
            resp = requests.get(identity_tracks_endpoint, params=params)
            track_listens = resp.json()
            job_extra_info["identity_response_time"] = get_time_diff(
                identity_response_time
            )
        except Exception as e:
            logger.error(
                f"Error retrieving track play counts - {identity_tracks_endpoint}, {e}"
            )

        plays = []
        user_track_listens = []
        track_hours = []
        # pylint: disable=W0105
        """
        Insert a row for each new count instance in the plays table
        1.) Loop through the listens to build a list of user_id to track_id pairs
        and track_id to current_hour for querying
        2.) Query the plays table for counts for both user-tracks pairs and anonymous
        listens of track by hour and build a dictionary for each mapping to counts
        3.) Loop through the listens again and only insert the difference in identity
        play count minus the existing plays in db
        """
        if "listens" in track_listens:
            # 1.) Get the user_id to track_id pairs and track_id to current hr pairs
            listens_query_building_time = time.time()
            for listen in track_listens["listens"]:
                if "userId" in listen and listen["userId"] != None:
                    # Add the user_id to track_id mapping
                    user_track_listens.append(
                        and_(
                            Play.play_item_id == listen["trackId"],
                            Play.user_id == listen["userId"],
                        )
                    )
                else:
                    # Since, the anonymous plays are stored by hour,
                    # find all plays in the last hour for this track
                    current_hour = dateutil.parser.parse(listen["createdAt"]).replace(
                        microsecond=0, second=0, minute=0
                    )
                    track_hours.append(
                        and_(
                            Play.user_id == None,
                            Play.play_item_id == listen["trackId"],
                            Play.created_at == current_hour,
                        )
                    )

            job_extra_info["listens_query_building_time"] = get_time_diff(
                listens_query_building_time
            )
            # 2.) Query the plays and build a dict
            listens_query_time = time.time()

            # Query the plays for existing user-track listens & build
            # a dict of { '{user_id}-{track_id}' : listen_count }
            user_track_plays_dict = {}
            if user_track_listens:
                user_track_play_counts = (
                    session.query(
                        Play.play_item_id, Play.user_id, func.count(Play.play_item_id)
                    )
                    .filter(or_(*user_track_listens))
                    .group_by(Play.play_item_id, Play.user_id)
                    .all()
                )

                user_track_plays_dict = {
                    f"{play[0]}-{play[1]}": play[2] for play in user_track_play_counts
                }

            # Query the plays for existing anon-tracks by hour & build
            # a dict of { '{track_id}-{timestamp}' : listen_count }
            anon_track_plays_dict = {}
            if track_hours:
                track_play_counts = (
                    session.query(
                        Play.play_item_id,
                        func.min(Play.created_at),
                        func.count(Play.play_item_id),
                    )
                    .filter(or_(*track_hours))
                    .group_by(Play.play_item_id)
                    .all()
                )
                anon_track_plays_dict = {
                    # pylint: disable=C0301
                    f"{play[0]}-{play[1].replace(microsecond=0, second=0, minute=0)}": play[
                        2
                    ]
                    for play in track_play_counts
                }
            job_extra_info["listens_query_time"] = get_time_diff(listens_query_time)
            build_insert_query_time = time.time()

            # 3.) Insert new listens - subtracting the identity listens from existsing listens
            for listen in track_listens["listens"]:
                if "userId" in listen and listen["userId"] != None:
                    track_id = listen["trackId"]
                    user_id = listen["userId"]
                    user_track_key = f"{track_id}-{user_id}"
                    # Get the existing listens for the track_id-user_id
                    user_track_play_count = user_track_plays_dict.get(user_track_key, 0)
                    new_play_count = listen["count"] - user_track_play_count
                    if new_play_count > 0:
                        plays.extend(
                            [
                                Play(
                                    user_id=listen["userId"],
                                    play_item_id=listen["trackId"],
                                    updated_at=listen["updatedAt"],
                                    created_at=listen["createdAt"],
                                )
                                for _ in range(new_play_count)
                            ]
                        )
                else:
                    # For anon track plays, check the current hour play counts
                    # and only insert new plays for the difference
                    current_hour = dateutil.parser.parse(listen["createdAt"]).replace(
                        microsecond=0, second=0, minute=0, tzinfo=None
                    )
                    track_id = listen["trackId"]
                    track_hr_key = f"{track_id}-{current_hour}"
                    # Get the existing listens from for the track_id-curren_hr
                    anon_hr_track_play_count = anon_track_plays_dict.get(
                        track_hr_key, 0
                    )
                    new_play_count = listen["count"] - anon_hr_track_play_count
                    if new_play_count > 0:
                        plays.extend(
                            [
                                Play(
                                    play_item_id=listen["trackId"],
                                    updated_at=listen["updatedAt"],
                                    created_at=listen["createdAt"],
                                )
                                for _ in range(new_play_count)
                            ]
                        )
            job_extra_info["build_insert_query_time"] = get_time_diff(
                build_insert_query_time
            )

        insert_refresh_time = time.time()
        has_lock = lock.owned()
        if plays and has_lock:
            session.bulk_save_objects(plays)
            # Parse returned UTC timestamp into datetime object and write timestam to redis
            # Format example 2021-10-26T19:01:09.814Z = '%Y-%m-%dT%H:%M:%S.%fZ'
            cache_timestamp = datetime.strptime(plays[-1].created_at, '%Y-%m-%dT%H:%M:%S.%fZ')
            redis_set_and_dump(redis, latest_legacy_play_db_key, cache_timestamp.timestamp())

        job_extra_info["has_lock"] = has_lock
        job_extra_info["number_rows_insert"] = len(plays)
        job_extra_info["insert_refresh_time"] = get_time_diff(insert_refresh_time)
        job_extra_info["total_time"] = get_time_diff(start_time)
        logger.info("index_plays.py | update_play_count complete", extra=job_extra_info)


######## CELERY TASK ########
@celery.task(name="update_play_count", bind=True)
def update_play_count(self):
    # Cache custom task class properties
    # Details regarding custom task context can be found in wiki
    # Custom Task definition can be found in src/app.py
    db = update_play_count.db
    redis = update_play_count.redis

    # Define lock acquired boolean
    have_lock = False

    # Define redis lock object with a timeout of 10 minutes
    update_lock = redis.lock("update_play_count_lock", timeout=10 * 60)
    try:
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            get_track_plays(self, db, update_lock, redis)
        else:
            logger.error(
                f"index_plays.py | update_play_count | {self.request.id} | Failed to acquire update_play_count_lock",
                extra={"job": JOB},
            )
    except Exception as e:
        logger.error(
            "Fatal error in main loop of update_play_count",
            exc_info=True,
            extra={"job": JOB},
        )
        raise e
    finally:
        if have_lock:
            update_lock.release()
