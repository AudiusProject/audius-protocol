import logging
from urllib.parse import urljoin
import requests
import dateutil.parser
import datetime
from sqlalchemy import func, desc
from src.models import Play
from src.tasks.celery_app import celery

logger = logging.getLogger(__name__)

# The number of listens to get per request to identity
REQUEST_LISTENS_LIMIT = 5000

# Retrieve the play counts from the identity service
# NOTE: indexing the plays will eventually be a part of `index_blocks`


def get_track_plays(self, db):
    with db.scoped_session() as session:
        # Get the most retrieved play date in the db to use as an offet for fetching
        # more play counts from identity
        most_recent_play_date = session.query(
            Play.updated_at
        ).order_by(
            desc(Play.updated_at),
            desc(Play.id)
        ).first()
        if most_recent_play_date == None:
            # Make the date way back in the past to get the first play count onwards
            most_recent_play_date = datetime.datetime(
                2000, 1, 1, 0, 0).timestamp()
        else:
            most_recent_play_date = most_recent_play_date[0].timestamp()

        # Create and query identity service endpoint for track play counts
        identity_url = update_play_count.shared_config['discprov']['identity_service_url']
        params = {'startTime': most_recent_play_date,
                  'limit': REQUEST_LISTENS_LIMIT}
        identity_tracks_endpoint = urljoin(identity_url, 'listens/bulk')

        track_listens = {}
        try:
            resp = requests.get(identity_tracks_endpoint, params=params)
            track_listens = resp.json()
        except Exception as e:
            logger.error(
                f'Error retrieving track play counts - {identity_tracks_endpoint}, {e}'
            )

        # Insert a new row for each count instance in the plays table
        plays = []
        if 'listens' in track_listens:
            for listen in track_listens['listens']:
                if 'userId' in listen and listen['userId'] != None:
                    # If the userId is present, query for exist plays and only
                    # insert new plays for the difference
                    user_track_play_count = session.query(
                        func.count(Play.play_item_id)
                    ).filter(
                        Play.play_item_id == listen['trackId'],
                        Play.user_id == listen['userId']
                    ).scalar()
                    new_play_count = listen['count'] - user_track_play_count
                    if new_play_count > 0:
                        plays.extend([
                            Play(
                                user_id=listen['userId'],
                                play_item_id=listen['trackId'],
                                created_at=listen['createdAt'],
                            ) for _ in range(new_play_count)
                        ])
                else:
                    # For anon track plays, check the current hour play counts
                    # and only insert new plays for the difference
                    current_hour_query = dateutil.parser.parse(
                        listen['createdAt']
                    ).replace(microsecond=0, second=0, minute=0)
                    anon_hr_track_play_count = session.query(
                        func.count(Play.play_item_id)
                    ).filter(
                        Play.play_item_id == listen['trackId'],
                        Play.user_id == None,
                        Play.created_at >= current_hour_query
                    ).scalar()
                    new_play_count = listen['count'] - anon_hr_track_play_count
                    if new_play_count > 0:
                        plays.extend([
                            Play(
                                play_item_id=listen['trackId'],
                                created_at=listen['createdAt'],
                            ) for _ in range(new_play_count)
                        ])

        if len(plays) > 0:
            session.bulk_save_objects(plays)
            session.execute("REFRESH MATERIALIZED VIEW aggregate_plays")

######## CELERY TASK ########
@celery.task(name="update_play_count", bind=True)
def update_play_count(self):
    # Cache custom task class properties
    # Details regarding custom task context can be found in wiki
    # Custom Task definition can be found in src/__init__.py
    db = update_play_count.db
    redis = update_play_count.redis

    # Define lock acquired boolean
    have_lock = False

    # Define redis lock object
    update_lock = redis.lock("update_play_count_lock", blocking_timeout=25)
    try:
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            logger.info(
                f"index_plays.py | update_play_count | {self.request.id} | Acquired update_play_count_lock")
            get_track_plays(self, db)
            logger.info(
                f"index_plays.py | update_play_count | {self.request.id} | Processing complete within session")
        else:
            logger.error(
                f"index_plays.py | update_play_count | {self.request.id} | Failed to acquire update_play_count_lock")
    except Exception as e:
        logger.error(
            "Fatal error in main loop of update_play_count", exc_info=True)
        raise e
    finally:
        if have_lock:
            update_lock.release()
