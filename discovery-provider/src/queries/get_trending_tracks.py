import logging  # pylint: disable=C0302
import datetime
from dateutil.parser import parse
from flask.globals import request

from src.models import Track
from src.utils import helpers
from src.utils.db_session import get_db_read_replica
from src.queries.query_helpers import populate_track_metadata, \
    get_users_ids, get_users_by_id
from src.tasks.generate_trending import generate_trending
from src.utils.redis_cache import extract_key, use_redis_cache

logger = logging.getLogger(__name__)

SCORES_CACHE_DURATION_SEC = 10 * 60

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
    limit, offset, current_user_id = args.get("limit"), args.get("offset"), args.get("current_user_id")
    # current_user_id = get_current_user_id(required=False)

    db = get_db_read_replica()

    time = args.get('time')
    query_time = None if time not in ["day", "week", "month", "year"] else time

    with db.scoped_session() as session:
        def get_unpopulated_trending():
            trending_tracks = generate_trending(
                session, query_time, args.get('genre', None),
                limit, offset)

            track_scores = [z(time, track) for track in trending_tracks['listen_counts']]
            sorted_track_scores = sorted(track_scores, key=lambda k: k['score'], reverse=True)

            track_ids = [track['track_id'] for track in sorted_track_scores]

            tracks = session.query(Track).filter(
                Track.is_current == True,
                Track.is_unlisted == False,
                Track.stem_of == None,
                Track.track_id.in_(track_ids)
            ).all()
            tracks = helpers.query_result_to_list(tracks)
            return (tracks, track_ids)

        # get scored trending tracks, either
        # through cached redis value, or through `get_unpopulated_trending`
        cache_keys = {"genre": args.get("genre"), "time": args.get("time")}
        key = extract_key(f"generated-trending:{request.path}", cache_keys.items())
        (tracks, track_ids) = use_redis_cache(key, SCORES_CACHE_DURATION_SEC, get_unpopulated_trending)

        # populate track metadata
        tracks = populate_track_metadata(
            session, track_ids, tracks, current_user_id)
        tracks_map = {track['track_id']: track for track in tracks}

        # Re-sort the populated tracks b/c it loses sort order in sql query
        sorted_tracks = [tracks_map[track_id] for track_id in track_ids]

        if args.get("with_users", False):
            user_id_list = get_users_ids(sorted_tracks)
            users = get_users_by_id(session, user_id_list)
            for track in sorted_tracks:
                user = users[track['owner_id']]
                if user:
                    track['user'] = user
        return sorted_tracks
