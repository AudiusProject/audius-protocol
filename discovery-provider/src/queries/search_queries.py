from enum import Enum
import logging  # pylint: disable=C0302
from functools import cmp_to_key
from flask import Blueprint, request
import sqlalchemy

from src import api_helpers, exceptions
from src.queries.search_config import trackTitleWeight, userNameWeight, playlistNameWeight
from src.models import Track, RepostType, Save, SaveType, Follow
from src.utils import helpers
from src.utils.db_session import get_db_read_replica
from src.queries import response_name_constants
from src.queries.get_unpopulated_users import get_unpopulated_users
from src.queries.get_unpopulated_tracks import get_unpopulated_tracks
from src.queries.get_unpopulated_playlists import get_unpopulated_playlists
from src.queries.search_track_tags import search_track_tags
from src.queries.search_user_tags import search_user_tags
from src.queries.query_helpers import get_current_user_id, get_users_by_id, get_users_ids, populate_user_metadata, \
    populate_track_metadata, populate_playlist_metadata, get_pagination_vars, populate_playlist_repost_counts, \
    populate_user_follower_counts, populate_track_repost_counts

logger = logging.getLogger(__name__)
bp = Blueprint("search_tags", __name__)


######## VARS ########

# Search for at least 10 items in the lexeme even if the user requests fewer
# this is to allow secondary sorts to be more effective.
MIN_SEARCH_LEXEME_LIMIT = 10

class SearchKind(Enum):
    all = 1
    tracks = 2
    users = 3
    playlists = 4
    albums = 5


######## UTILS ########

def compare_users(user1, user2):
    """Comparison util for ordering user search results."""
    # Any verified user is ranked higher
    if user1["is_verified"] and not user2["is_verified"]:
        return -1
    if user2["is_verified"] and not user1["is_verified"]:
        return 1
    if "follower_count" in user1 and "follower_count" in user2:
        return user2["follower_count"] - user1["follower_count"]
    return 0


def compare_tracks(track1, track2):
    """Comparison util for ordering track search results."""
    if "repost_count" in track1 and "repost_count" in track2:
        return track2["repost_count"] - track1["repost_count"]
    return 0


def compare_playlists(playlist1, playlist2):
    """Comparison util for ordering playlist search results."""
    if "repost_count" in playlist1 and "repost_count" in playlist2:
        return playlist2["repost_count"] - playlist1["repost_count"]
    return 0


######## ROUTES ########

@bp.route("/search/tags", methods=("GET",))
def search_tags():
    search_str = request.args.get("query", type=str)
    current_user_id = get_current_user_id(required=False)
    if not search_str:
        raise exceptions.ArgumentError("Invalid value for parameter 'query'")

    user_tag_count = request.args.get("user_tag_count", type=str)
    if not user_tag_count:
        user_tag_count = "2"

    kind = request.args.get("kind", type=str, default="all")
    validSearchKinds = [SearchKind.all, SearchKind.tracks, SearchKind.users]
    try:
        searchKind = SearchKind[kind]
        if searchKind not in validSearchKinds:
            raise Exception
    except Exception:
        return api_helpers.error_response(
            "Invalid value for parameter 'kind' must be in %s" % [
                k.name for k in validSearchKinds],
            400
        )

    results = {}

    (limit, offset) = get_pagination_vars()
    db = get_db_read_replica()
    with db.scoped_session() as session:
        if (searchKind in [SearchKind.all, SearchKind.tracks]):
            results['tracks'] = search_track_tags(session, {
                'search_str': search_str,
                'current_user_id': current_user_id,
                'limit': limit,
                'offset': offset
            })

        if (searchKind in [SearchKind.all, SearchKind.users]):
            results['users'] = search_user_tags(session, {
                'search_str': search_str,
                'current_user_id': current_user_id,
                "user_tag_count": user_tag_count,
                'limit': limit,
                'offset': offset
            })


    # Add personalized results for a given user
    if current_user_id:
        if (searchKind in [SearchKind.all, SearchKind.tracks]):
            # Query saved tracks for the current user that contain this tag
            track_ids = [track['track_id'] for track in results['tracks']]
            track_play_counts = {
                track['track_id']: track[response_name_constants.play_count] for track in results['tracks']
            }

            saves_query = (
                session.query(Save.save_item_id)
                .filter(
                    Save.is_current == True,
                    Save.is_delete == False,
                    Save.save_type == SaveType.track,
                    Save.user_id == current_user_id,
                    Save.save_item_id.in_(track_ids)
                )
                .all()
            )
            saved_track_ids = [i[0] for i in saves_query]
            saved_tracks = (
                session.query(Track)
                .filter(
                    Track.is_current == True,
                    Track.is_delete == False,
                    Track.is_unlisted == False,
                    Track.stem_of == None,
                    Track.track_id.in_(saved_track_ids),
                )
                .all()
            )
            saved_tracks = helpers.query_result_to_list(saved_tracks)
            for saved_track in saved_tracks:
                saved_track_id = saved_track["track_id"]
                saved_track[response_name_constants.play_count] = \
                    track_play_counts.get(saved_track_id, 0)
            saved_tracks = \
                populate_track_metadata(
                    session, saved_track_ids, saved_tracks, current_user_id)

            # Sort and paginate
            play_count_sorted_saved_tracks = \
                sorted(
                    saved_tracks, key=lambda i: i[response_name_constants.play_count], reverse=True)

            play_count_sorted_saved_tracks = \
                play_count_sorted_saved_tracks[slice(
                    offset, offset + limit, 1)]

            results['saved_tracks'] = play_count_sorted_saved_tracks

        if (searchKind in [SearchKind.all, SearchKind.users]):
            # Query followed users that have referenced this tag
            user_ids = [user['user_id'] for user in results['users']]
            followed_user_query = (
                session.query(Follow.followee_user_id)
                .filter(
                    Follow.is_current == True,
                    Follow.is_delete == False,
                    Follow.follower_user_id == current_user_id,
                    Follow.followee_user_id.in_(user_ids)
                )
                .all()
            )
            followed_user_ids = [i[0] for i in followed_user_query]
            followed_users = get_unpopulated_users(session, followed_user_ids)
            followed_users = \
                populate_user_metadata(
                    session,
                    followed_user_ids,
                    followed_users,
                    current_user_id
                )

            followed_users_followee_sorted = \
                sorted(
                    followed_users,
                    key=lambda i: i[response_name_constants.follower_count],
                    reverse=True)

            followed_users_followee_sorted = \
                followed_users_followee_sorted[slice(
                    offset, offset + limit, 1)]

            results['followed_users'] = followed_users_followee_sorted

    return api_helpers.success_response(results)

def add_users(session, results):
    user_id_list = get_users_ids(results)
    users = get_users_by_id(session, user_id_list)
    for result in results:
        user_id = None
        if 'playlist_owner_id' in result:
            user_id = result['playlist_owner_id']
        elif 'owner_id' in result:
            user_id = result['owner_id']

        if user_id is not None:
            user = users[user_id]
            result["user"] = user
    return results

# SEARCH QUERIES
# We chose to use the raw SQL instead of SQLAlchemy because we're pushing SQLAlchemy to it's
# limit to do this query by creating new wrappers for pg functions that do not exist like
# TSQuery and pg_trgm specific functions like similarity.
#
# However, we query for object_id and fetch the actual objects using SQLAlchemy to preserve
# the full objects and helper methods that the ORM provides. This is done in post-processing
# after the initial text query executes.
#
# search query against custom materialized view created in alembic migration
# - returns all object ids which have a trigram match with query string
# - order by descending similarity and paginate
# - de-duplicates object_ids with multiple hits, returning highest match
#
# queries can be called for public data, or personalized data
# - personalized data will return only saved tracks, saved playlists, or followed users given current_user_id
#
# @devnote - track_ids argument should match tracks argument


def search(args):
    """ Perform a search. `args` should contain `is_auto_complete`,
    `query`, `kind`, `current_user_id`, `with_users`, and `only_downloadable`
    """
    searchStr = args.get("query")

    # when creating query table, we substitute this too
    searchStr = searchStr.replace('&', 'and')

    kind = args.get("kind", "all")
    with_users = args.get("with_users")
    is_auto_complete = args.get("is_auto_complete")
    current_user_id = args.get("current_user_id")
    only_downloadable = args.get("only_downloadable")
    limit = args.get("limit")
    offset = args.get("offset")

    searchKind = SearchKind[kind]

    results = {}
    if searchStr:
        db = get_db_read_replica()
        with db.scoped_session() as session:
            def with_users_added(results):
                if not with_users:
                    return results
                return add_users(session, results)

            # Accumulate user_ids for later
            user_ids = set()

            if (searchKind in [SearchKind.all, SearchKind.tracks]):
                results['tracks'] = track_search_query(
                    session, searchStr, limit, offset, False, is_auto_complete, current_user_id, only_downloadable)
                user_ids.update(get_users_ids(results['tracks']))
                if current_user_id:
                    results['saved_tracks'] = track_search_query(
                        session, searchStr, limit, offset, True, is_auto_complete, current_user_id, only_downloadable)
                    user_ids.update(get_users_ids(results['saved_tracks']))
            if (searchKind in [SearchKind.all, SearchKind.users]):
                results['users'] = user_search_query(
                    session, searchStr, limit, offset, False, is_auto_complete, current_user_id)
                if current_user_id:
                    results['followed_users'] = user_search_query(
                        session, searchStr, limit, offset, True, is_auto_complete, current_user_id)
            if (searchKind in [SearchKind.all, SearchKind.playlists]):
                results['playlists'] = playlist_search_query(
                    session,
                    searchStr,
                    limit,
                    offset,
                    False,
                    False,
                    is_auto_complete,
                    current_user_id
                )
                user_ids.update(get_users_ids(results['playlists']))
                if current_user_id:
                    results['saved_playlists'] = playlist_search_query(
                        session,
                        searchStr,
                        limit,
                        offset,
                        False,
                        True,
                        is_auto_complete,
                        current_user_id
                    )
                    user_ids.update(get_users_ids(results['saved_playlists']))
            if (searchKind in [SearchKind.all, SearchKind.albums]):
                results['albums'] = playlist_search_query(
                    session, searchStr, limit, offset, True, False, is_auto_complete, current_user_id)
                user_ids.update(get_users_ids(results['albums']))
                if current_user_id:
                    results['saved_albums'] = playlist_search_query(
                        session,
                        searchStr,
                        limit,
                        offset,
                        True,
                        True,
                        is_auto_complete,
                        current_user_id
                    )
                user_ids.update(get_users_ids(results['albums']))

            # Add users back
            users = get_users_by_id(session, list(user_ids), current_user_id)
            logger.warning("USERS MAP!")

            for (_, result_list) in results.items():
                for result in result_list:
                    user_id = None
                    if 'playlist_owner_id' in result:
                        user_id = result['playlist_owner_id']
                    elif 'owner_id' in result:
                        user_id = result['owner_id']

                    if user_id is not None:
                        user = users[user_id]
                        result["user"] = user

    return results

def track_search_query(
        session,
        searchStr,
        limit,
        offset,
        personalized,
        is_auto_complete,
        current_user_id,
        only_downloadable):
    if personalized and not current_user_id:
        return []

    res = sqlalchemy.text(
        # pylint: disable=C0301
        f"""
        select track_id from (
            select
                track_id,
                (sum(score) + (:title_weight * similarity(coalesce(title, ''), query))) as total_score
            from (
                select
                    d."track_id" as track_id, d."word" as word, similarity(d."word", :query) as score,
                    d."track_title" as title, :query as query
                from "track_lexeme_dict" d
                {
                    'inner join "saves" s on s.save_item_id = d.track_id'
                    if personalized and current_user_id
                    else ""
                }
                {
                    'inner join "tracks" t on t.track_id = d.track_id'
                    if only_downloadable
                    else ""
                }
                where d."word" % :query
                {
                    "and s.save_type='track' and s.is_current=true and " +
                    "s.is_delete=false and s.user_id = :current_user_id"
                    if personalized and current_user_id
                    else ""
                }
                {
                    "and (t.download->>'is_downloadable')::boolean is True"
                    if only_downloadable
                    else ""
                }
            ) as results
            group by track_id, title, query
        ) as results2
        order by total_score desc, track_id asc
        limit :limit
        offset :offset;
        """
    )

    track_ids = session.execute(
        res,
        {
            "query": searchStr,
            "limit": max(limit, MIN_SEARCH_LEXEME_LIMIT),
            "offset": offset,
            "title_weight": trackTitleWeight,
            "current_user_id": current_user_id
        },
    ).fetchall()

    # track_ids is list of tuples - simplify to 1-D list
    track_ids = [i[0] for i in track_ids]
    tracks = get_unpopulated_tracks(session, track_ids, True)

    # TODO: Populate track metadata should be sped up to be able to be
    # used in search autocomplete as that'll give us better results.
    if is_auto_complete == True:
        # fetch users for tracks
        track_owner_ids = list(map(lambda track: track["owner_id"], tracks))
        users = get_unpopulated_users(session, track_owner_ids)
        users_dict = {user["user_id"]: user for user in users}

        # attach user objects to track objects
        for track in tracks:
            track["user"] = users_dict[track["owner_id"]]
        tracks = populate_track_repost_counts(session, track_ids, tracks)
    else:
        # bundle peripheral info into track results
        tracks = populate_track_metadata(
            session, track_ids, tracks, current_user_id)

    # Preserve order from track_ids above
    tracks_map = {}
    for t in tracks:
        tracks_map[t["track_id"]] = t
    tracks = [tracks_map[track_id] for track_id in track_ids]

    # Sort tracks by extra criteria for "best match"
    tracks.sort(key=cmp_to_key(compare_tracks))

    return tracks[0:limit]


def user_search_query(session, searchStr, limit, offset, personalized, is_auto_complete, current_user_id):
    if personalized and not current_user_id:
        return []

    res = sqlalchemy.text(
        f"""
        select user_id from (
            select user_id, (sum(score) + (:name_weight * similarity(coalesce(name, ''), query))) as total_score from (
                select
                    d."user_id" as user_id, d."word" as word, similarity(d."word", :query) as score,
                    d."user_name" as name, :query as query
                from "user_lexeme_dict" d
                {
                    'inner join "follows" f on f.followee_user_id=d.user_id'
                    if personalized and current_user_id
                    else ""
                }
                where d."word" % :query
                {
                    "and f.is_current=true and f.is_delete=false and f.follower_user_id=:current_user_id"
                    if personalized and current_user_id
                    else ""
                }
            ) as results
            group by user_id, name, query
        ) as results2
        order by total_score desc, user_id asc
        limit :limit
        offset :offset;
        """
    )

    user_ids = session.execute(
        res,
        {
            "query": searchStr,
            "limit": max(limit, MIN_SEARCH_LEXEME_LIMIT),
            "offset": offset,
            "name_weight": userNameWeight,
            "current_user_id": current_user_id
        },
    ).fetchall()

    # user_ids is list of tuples - simplify to 1-D list
    user_ids = [i[0] for i in user_ids]

    users = get_unpopulated_users(session, user_ids)

    # TODO: Populate user metadata should be sped up to be able to be
    # used in search autocomplete as that'll give us better results.
    if is_auto_complete:
        # get follower information to improve search ordering
        users = populate_user_follower_counts(session, user_ids, users)
    else:
        # bundle peripheral info into user results
        users = populate_user_metadata(
            session, user_ids, users, current_user_id)


    # Preserve order from user_ids above
    user_map = {}
    for u in users:
        user_map[u["user_id"]] = u
    users = [user_map[user_id] for user_id in user_ids]

    # Sort users by extra criteria for "best match"
    users.sort(key=cmp_to_key(compare_users))

    return users[0:limit]


def playlist_search_query(session, searchStr, limit, offset, is_album, personalized, is_auto_complete, current_user_id):
    if personalized and not current_user_id:
        return []

    table_name = 'album_lexeme_dict' if is_album else 'playlist_lexeme_dict'
    repost_type = RepostType.album if is_album else RepostType.playlist
    save_type = SaveType.album if is_album else SaveType.playlist

    # SQLAlchemy doesn't expose a way to escape a string with double-quotes instead of
    # single-quotes, so we have to use traditional string substitution. This is safe
    # because the value is not user-specified.
    res = sqlalchemy.text(
        # pylint: disable=C0301
        f"""
        select playlist_id from (
            select
                playlist_id,
                (sum(score) + (:name_weight * similarity(coalesce(playlist_name, ''), query))) as total_score
            from (
                select
                    d."playlist_id" as playlist_id, d."word" as word, similarity(d."word", :query) as score,
                    d."playlist_name" as playlist_name, :query as query
                from "{table_name}" d
                {
                    'inner join "saves" s on s.save_item_id = d.playlist_id'
                    if personalized and current_user_id
                    else ""
                }
                where d."word" % :query
                {
                    "and s.save_type='" + save_type +
                    "' and s.is_current=true and s.is_delete=false and s.user_id=:current_user_id"
                    if personalized and current_user_id
                    else ""
                }
            ) as results
            group by playlist_id, playlist_name, query
        ) as results2
        order by total_score desc, playlist_id asc
        limit :limit
        offset :offset;
        """
    )

    playlist_ids = session.execute(
        res,
        {
            "query": searchStr,
            "limit": max(limit, MIN_SEARCH_LEXEME_LIMIT),
            "offset": offset,
            "name_weight": playlistNameWeight,
            "current_user_id": current_user_id
        },
    ).fetchall()

    # playlist_ids is list of tuples - simplify to 1-D list
    playlist_ids = [i[0] for i in playlist_ids]
    playlists = get_unpopulated_playlists(session, playlist_ids, True)

    # TODO: Populate playlist metadata should be sped up to be able to be
    # used in search autocomplete as that'll give us better results.
    if is_auto_complete:
        # fetch users for playlists
        playlist_owner_ids = list(map(lambda playlist: playlist["playlist_owner_id"], playlists))
        users = get_unpopulated_users(session, playlist_owner_ids)
        users_dict = {user["user_id"]: user for user in users}

        # attach user objects to playlist objects
        for playlist in playlists:
            playlist["user"] = users_dict[playlist["playlist_owner_id"]]

        playlists = populate_playlist_repost_counts(session, playlist_ids, playlists, [repost_type])
    else:
        # bundle peripheral info into playlist results
        playlists = populate_playlist_metadata(
            session,
            playlist_ids,
            playlists,
            [repost_type],
            [save_type],
            current_user_id
        )

    # Preserve order from playlist_ids above
    playlists_map = {}
    for p in playlists:
        playlists_map[p["playlist_id"]] = p
    playlists = [playlists_map[playlist_id] for playlist_id in playlist_ids]

    # Sort playlists by extra criteria for "best match"
    playlists.sort(key=cmp_to_key(compare_playlists))

    return playlists[0:limit]
