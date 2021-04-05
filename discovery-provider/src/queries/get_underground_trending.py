import logging # pylint: disable=C0302
from datetime import datetime, timedelta
import redis
from sqlalchemy import func
from dateutil.parser import parse

from src.utils.db_session import get_db_read_replica
from src.utils.redis_cache import use_redis_cache
from src.models import Track, RepostType, Follow, SaveType, User, AggregatePlays
from src.queries.query_helpers import \
    get_karma, get_repost_counts, get_save_counts
from src.queries.get_unpopulated_tracks import get_unpopulated_tracks
from src.queries.query_helpers import populate_track_metadata, \
    get_users_ids, get_users_by_id
from src.api.v1.helpers import extend_track
from src.queries.get_trending_tracks import make_trending_cache_key
from src.utils.redis_cache import get_pickled_key
from src.utils.config import shared_config

redis_url = shared_config["redis"]["url"]
redis = redis.Redis.from_url(url=redis_url)

logger = logging.getLogger(__name__)

UNDERGROUND_TRENDING_CACHE_KEY = "generated-trending-tracks-underground"
UNDERGROUND_TRENDING_LENGTH = 50

S = 1500
r = 1500
q = 50
o = 21
f = 7
b = 5
qw = 50
hg = 1
ie = 0.25
pn = 0.01
u = 30.0
qq = 0.001
oi = 20
nb = 750
om = 1500
qr = 10

def z2(time, track):
    # pylint: disable=W,C,R
    mn = track['listens']
    c =track['windowed_repost_count']
    x = track['repost_count']
    v =track['windowed_save_count']
    ut =track['save_count']
    ll=track['created_at']
    bq=track['owner_follower_count']
    ty = track['owner_verified']
    kz = track['karma']
    xy=max
    uk=pow
    if bq<3:
        return{'score':0,**track}
    oj = qq if ty else 1
    zu = 1
    if bq >= nb:
        zu = xy(uk(oi,1-((1/nb)*(bq-nb)+1)),1/oi)
    vb = ((b*mn+qw*c+hg*v+ie*x+pn*ut+zu*bq)*kz*zu*oj)
    te = 7
    fd = datetime.now()
    xn = parse(ll)
    ul = (fd-xn).days
    rq = 1
    if ul > te:
        rq = xy((1.0 / u),(uk(u,(1 - ul/te))))
    return{'score':vb * rq, **track}

def get_scorable_track_data(session, redis_instance):
    """
    Returns a map: {
        "track_id": string
        "created_at": string
        "owner_id": number
        "windowed_save_count": number
        "save_count": number
        "repost_count": number
        "windowed_repost_count": number
        "owner_follower_count": number
        "karma": number
        "listens": number
        "owner_verified": boolean
    }
    """

    trending_key = make_trending_cache_key("week", None)
    track_ids = []
    old_trending = get_pickled_key(redis_instance, trending_key)
    if old_trending:
        track_ids = old_trending[1]
    exclude_track_ids = track_ids[:qr]

    # Get followers
    follower_query = (
        session.query(
            Follow.followee_user_id.label('user_id'),
            User.is_verified.label('is_verified'),
            func.count(Follow.followee_user_id).label('follower_count')
        ).join(
            User,
            User.user_id == Follow.followee_user_id
        ).filter(
            Follow.is_current == True,
            Follow.is_delete == False,
            User.is_current == True,
            Follow.created_at < (datetime.now() - timedelta(days=f))
        ).group_by(Follow.followee_user_id, User.is_verified)
    ).subquery()

    # Get following
    following_query = (
        session.query(
            Follow.follower_user_id.label('user_id'),
            func.count(Follow.follower_user_id).label('following_count')
        ).filter(
            Follow.is_current == True,
            Follow.is_delete == False,
        ).group_by(Follow.follower_user_id)
    ).subquery()

    base_query = (
        session.query(
            AggregatePlays.play_item_id.label('track_id'),
            follower_query.c.user_id,
            follower_query.c.follower_count,
            AggregatePlays.count,
            Track.created_at,
            follower_query.c.is_verified)
        .join(Track, Track.track_id == AggregatePlays.play_item_id)
        .join(follower_query, follower_query.c.user_id == Track.owner_id)
        .join(following_query, following_query.c.user_id == Track.owner_id)
        .filter(
            Track.is_current == True,
            Track.is_delete == False,
            Track.is_unlisted == False,
            Track.stem_of == None,
            Track.track_id.notin_(exclude_track_ids),
            Track.created_at >= (datetime.now() - timedelta(days=o)),
            follower_query.c.follower_count < S,
            following_query.c.following_count < r,
            AggregatePlays.count >= q
        )
    ).all()

    tracks_map = {record[0]: {
        "track_id": record[0],
        "created_at": record[4].isoformat(timespec='seconds'),
        "owner_id": record[1],
        "windowed_save_count": 0,
        "save_count": 0,
        "repost_count": 0,
        "windowed_repost_count": 0,
        "owner_follower_count": record[2],
        "karma": 1,
        "listens": record[3],
        "owner_verified": record[5]
    } for record in base_query}

    track_ids = [record[0] for record in base_query]

    # Get all the extra values
    repost_counts = get_repost_counts(
        session,
        False,
        False,
        track_ids,
        [RepostType.track]
    )

    windowed_repost_counts = get_repost_counts(
        session,
        False,
        False,
        track_ids,
        [RepostType.track],
        None,
        "week"
    )

    save_counts = get_save_counts(
        session,
        False,
        False,
        track_ids,
        [SaveType.track]
    )

    windowed_save_counts = get_save_counts(
        session,
        False,
        False,
        track_ids,
        [SaveType.track],
        None,
        "week"
    )

    karma_scores = get_karma(session, tuple(track_ids), None)

    # Associate all the extra data
    for (track_id, repost_count) in repost_counts:
        tracks_map[track_id]["repost_count"] = repost_count
    for (track_id, repost_count) in windowed_repost_counts:
        tracks_map[track_id]["windowed_repost_count"] = repost_count
    for (track_id, save_count) in save_counts:
        tracks_map[track_id]["save_count"] = save_count
    for (track_id, save_count) in windowed_save_counts:
        tracks_map[track_id]["windowed_save_count"] = save_count
    for (track_id, karma) in karma_scores:
        tracks_map[track_id]["karma"] = karma

    return list(tracks_map.values())


def make_get_unpopulated_tracks(session, redis_instance):
    def wrapped():
        # Score and sort
        track_scoring_data = get_scorable_track_data(session, redis_instance)
        scored_tracks = [z2('week', track) for track in track_scoring_data]
        sorted_tracks = sorted(scored_tracks, key=lambda k: k['score'], reverse=True)
        sorted_tracks = sorted_tracks[:UNDERGROUND_TRENDING_LENGTH]

        # Get unpopulated metadata
        track_ids = [track["track_id"] for track in sorted_tracks]
        tracks = get_unpopulated_tracks(session, track_ids)
        return (tracks, track_ids)

    return wrapped

def get_underground_trending(args):
    db = get_db_read_replica()
    with db.scoped_session() as session:
        current_user_id = args.get("current_user_id", None)
        limit, offset = args.get("limit"), args.get("offset")

        (tracks, track_ids) = use_redis_cache(
            UNDERGROUND_TRENDING_CACHE_KEY,
            None,
            make_get_unpopulated_tracks(session, redis)
        )

        # Apply limit + offset early to reduce the amount of
        # population work we have to do
        if limit is not None and offset is not None:
            track_ids = track_ids[offset: limit + offset]

        tracks = populate_track_metadata(
            session,
            track_ids,
            tracks,
            current_user_id
        )

        tracks_map = {track['track_id']: track for track in tracks}

        # Re-sort the populated tracks b/c it loses sort order in sql query
        sorted_tracks = [tracks_map[track_id] for track_id in track_ids]
        user_id_list = get_users_ids(sorted_tracks)
        users = get_users_by_id(session, user_id_list, current_user_id)
        for track in sorted_tracks:
            user = users[track['owner_id']]
            if user:
                track['user'] = user
        sorted_tracks = list(map(extend_track, sorted_tracks))
        return sorted_tracks
