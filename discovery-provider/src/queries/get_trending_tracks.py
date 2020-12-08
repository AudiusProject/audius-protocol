import logging  # pylint: disable=C0302
import datetime
from time import time_ns
from dateutil.parser import parse
from flask.globals import request

from src.utils import redis_connection
from src.utils.db_session import get_db_read_replica
from src.queries.get_unpopulated_tracks import get_unpopulated_tracks
from src.queries.query_helpers import populate_track_metadata, \
    get_users_ids, get_users_by_id
from src.tasks.generate_trending import generate_trending
from src.utils.redis_cache import extract_key, get_pickled_key

logger = logging.getLogger(__name__)


def make_trending_cache_key(time_range, genre):
    """Makes a cache key resembling `generated-trending:week:electronic`"""
    return f"generated-trending:{time_range}:{(genre or '')}"

N = 1
a = max
M = pow
F = 50
O = 1
R = 0.25
i = 0.01
q = 20.0
T = {'day': 1, 'week':7, 'month':30, 'year':365, 'allTime': 100000}
def z(time, track):
    # pylint: disable=W,C,R
    E=track['listens']
    e=track['windowed_repost_count']
    t=track['repost_count']
    x=track['windowed_save_count']
    A=track['save_count']
    o=track['created_at']
    l=track['track_owner_follower_count']
    j=track['karma']
    if l<3:
        return{'score':0,**track}
    H=(N*E+F*e+O*x+R*t+i*A)*j
    L=T[time]
    K=datetime.datetime.now()
    w=parse(o)
    k=(K-w).days
    Q=1
    if k>L:
        Q=a((1.0/q),(M(q,(1-k/L))))
    return{'score':H*Q,**track}

def get_trending_tracks(args):
    """Gets trending by getting the currently cached tracks and then populating them."""
    with db.scoped_session() as session:
        current_user_id = args.get("current_user_id")
        db = get_db_read_replica()
        genre = args.get("genre")
        time = args.get('time', "week")
        query_time = "week" if time not in ["week", "month", "year"] else time
        key = make_trending_cache_key(query_time, genre)
        res = get_pickled_key(redis_connection.get_redis(), key)

        if not res:
            # TODO: log this error!
            logger.warning("Couldn't get trending!")
            return []
        logger.info("Got cached trending :)")
        (tracks, track_ids) = res

        # populate track metadata
        tracks = populate_track_metadata(
            session, track_ids, tracks, current_user_id)
        tracks_map = {track['track_id']: track for track in tracks}

        # Re-sort the populated tracks b/c it loses sort order in sql query
        sorted_tracks = [tracks_map[track_id] for track_id in track_ids]

        if args.get("with_users", False):
            user_id_list = get_users_ids(sorted_tracks)
            users = get_users_by_id(session, user_id_list, current_user_id)
            for track in sorted_tracks:
                user = users[track['owner_id']]
                if user:
                    track['user'] = user
        return sorted_tracks
