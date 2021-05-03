from enum import Enum
import concurrent.futures
import logging  # pylint: disable=C0302
from functools import cmp_to_key
from flask import Blueprint, request
import sqlalchemy

from src import api_helpers, exceptions
from src.queries.search_config import search_title_weight, user_name_weight, \
    search_similarity_weight, search_repost_weight, user_follower_weight, \
    search_user_name_weight, search_title_exact_match_boost, \
    search_handle_exact_match_boost, search_user_name_exact_match_boost, \
    user_handle_exact_match_boost
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
    populate_track_metadata, populate_playlist_metadata, get_pagination_vars

logger = logging.getLogger(__name__)
bp = Blueprint("search_tags", __name__)


######## VARS ########

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

def perform_search_query(db, search_type, args):
    """Performs a search query of a given `search_type`. Handles it's own session. Used concurrently."""
    with db.scoped_session() as session:
        search_str = args.get('search_str')
        limit = args.get('limit')
        offset = args.get('offset')
        is_auto_complete = args.get('is_auto_complete')
        current_user_id = args.get('current_user_id')
        only_downloadable = args.get('only_downloadable')

        results = None
        if search_type == 'tracks':
            results = track_search_query(
                session,
                search_str,
                limit,
                offset,
                False,
                is_auto_complete,
                current_user_id,
                only_downloadable
            )
        elif search_type == 'saved_tracks':
            results = track_search_query(
                session,
                search_str,
                limit,
                offset,
                True,
                is_auto_complete,
                current_user_id,
                only_downloadable
            )
        elif search_type == 'users':
            results = user_search_query(
                session,
                search_str,
                limit,
                offset,
                False,
                is_auto_complete,
                current_user_id
            )
        elif search_type == 'followed_users':
            results = user_search_query(
                session,
                search_str,
                limit, offset,
                True,
                is_auto_complete,
                current_user_id
            )
        elif search_type == 'playlists':
            results = playlist_search_query(
                session,
                search_str,
                limit,
                offset,
                False,
                False,
                is_auto_complete,
                current_user_id
            )
        elif search_type == 'saved_playlists':
            results = playlist_search_query(
                session,
                search_str,
                limit,
                offset,
                False,
                True,
                is_auto_complete,
                current_user_id
            )
        elif search_type == 'albums':
            results = playlist_search_query(
                session,
                search_str,
                limit,
                offset,
                True,
                False,
                is_auto_complete,
                current_user_id
            )
        elif search_type == 'saved_albums':
            results = playlist_search_query(
                session,
                search_str,
                limit,
                offset,
                True,
                True,
                is_auto_complete,
                current_user_id
            )
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
    `query`, `kind`, `current_user_id`, and `only_downloadable`
    """
    search_str = args.get("query")

    # when creating query table, we substitute this too
    search_str = search_str.replace('&', 'and')

    kind = args.get("kind", "all")
    is_auto_complete = args.get("is_auto_complete")
    current_user_id = args.get("current_user_id")
    only_downloadable = args.get("only_downloadable")
    limit = args.get("limit")
    offset = args.get("offset")

    searchKind = SearchKind[kind]

    results = {}

    # Accumulate user_ids for later
    user_ids = set()

    # Create args for perform_search_query
    search_args = {
        "search_str": search_str,
        "limit": limit,
        "offset": offset,
        "is_auto_complete": is_auto_complete,
        "current_user_id": current_user_id,
        "only_downloadable": only_downloadable
    }

    if search_str:
        db = get_db_read_replica()
        # Concurrency approach:
        # Spin up a ThreadPoolExecutor for each request to perform_search_query
        # to perform the different search types in parallel.
        # After each future resolves, we then add users for each entity in a single
        # db round trip.
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
            # Keep a mapping of future -> search_type
            futures_map = {}
            futures = []

            # Helper fn to submit a future and add it to bookkeeping data structures
            def submit_and_add(search_type):
                future = executor.submit(perform_search_query, db, search_type, search_args)
                futures.append(future)
                futures_map[future] = search_type

            if (searchKind in [SearchKind.all, SearchKind.tracks]):
                submit_and_add("tracks")
                if current_user_id:
                    submit_and_add("saved_tracks")

            if (searchKind in [SearchKind.all, SearchKind.users]):
                submit_and_add("users")
                if current_user_id:
                    submit_and_add("followed_users")

            if (searchKind in [SearchKind.all, SearchKind.playlists]):
                submit_and_add("playlists")
                if current_user_id:
                    submit_and_add("saved_playlists")

            if (searchKind in [SearchKind.all, SearchKind.albums]):
                submit_and_add("albums")
                if current_user_id:
                    submit_and_add("saved_albums")

            for future in concurrent.futures.as_completed(futures):
                search_result = future.result()
                future_type = futures_map[future]

                # Add to the final results
                results[future_type] = search_result

                # Add to user_ids
                user_ids.update(get_users_ids(search_result))

            with db.scoped_session() as session:
                # Add users back
                users = get_users_by_id(session, list(user_ids), current_user_id)

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
        search_str,
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
        select track_id, b.balance, b.associated_wallets_balance from (
            select distinct on (owner_id) track_id, owner_id, total_score from (
                select track_id, owner_id,
                    (
                        (:similarity_weight * sum(score)) +
                        (:title_weight * similarity(coalesce(title, ''), query)) +
                        (:user_name_weight * similarity(coalesce(user_name, ''), query)) +
                        (:repost_weight * log(case when (repost_count = 0) then 1 else repost_count end)) +
                        (case when (lower(query) = coalesce(title, '')) then :title_match_boost else 0 end) +
                        (case when (lower(query) = handle) then :handle_match_boost else 0 end) +
                        (case when (lower(query) = user_name) then :user_name_match_boost else 0 end)
                    ) as total_score
                from (
                    select
                        d."track_id" as track_id, d."word" as word, similarity(d."word", :query) as score,
                        d."track_title" as title, :query as query, d."user_name" as user_name, d."handle" as handle,
                        d."repost_count" as repost_count, d."owner_id" as owner_id
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
                    where (d."word" % lower(:query) or d."handle" = lower(:query) or d."user_name" % lower(:query))
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
                group by track_id, title, query, user_name, handle, repost_count, owner_id
            ) as results2
            order by owner_id, total_score desc
        ) as u left join user_balances b on u.owner_id = b.user_id
        order by total_score desc
        limit :limit
        offset :offset;
        """
    )

    track_data = session.execute(
        res,
        {
            "query": search_str,
            "limit": limit,
            "offset": offset,
            "title_weight": search_title_weight,
            "repost_weight": search_repost_weight,
            "similarity_weight": search_similarity_weight,
            "current_user_id": current_user_id,
            "user_name_weight": search_user_name_weight,
            "title_match_boost": search_title_exact_match_boost,
            "handle_match_boost": search_handle_exact_match_boost,
            "user_name_match_boost": search_user_name_exact_match_boost
        },
    ).fetchall()

    # track_ids is list of tuples - simplify to 1-D list
    track_ids = [i[0] for i in track_data]
    tracks = get_unpopulated_tracks(session, track_ids, True)

    # TODO: Populate track metadata should be sped up to be able to be
    # used in search autocomplete as that'll give us better results.
    if is_auto_complete:
        # fetch users for tracks
        track_owner_ids = list(map(lambda track: track["owner_id"], tracks))
        users = get_unpopulated_users(session, track_owner_ids)
        users_dict = {user["user_id"]: user for user in users}

        # attach user objects to track objects
        for i, track in enumerate(tracks):
            user = users_dict[track["owner_id"]]
            # Add user balance
            balance = track_data[i][1]
            associated_balance = track_data[i][2]
            user[response_name_constants.balance] = balance
            user[response_name_constants.associated_wallets_balance] = associated_balance
            track["user"] = user
    else:
        # bundle peripheral info into track results
        tracks = populate_track_metadata(
            session, track_ids, tracks, current_user_id)

    # Preserve order from track_ids above
    tracks_map = {}
    for t in tracks:
        tracks_map[t["track_id"]] = t
    tracks = [tracks_map[track_id] for track_id in track_ids]

    return tracks[0:limit]

def user_search_query(session, search_str, limit, offset, personalized, is_auto_complete, current_user_id):
    if personalized and not current_user_id:
        return []

    res = sqlalchemy.text(
        f"""
        select u.user_id, b.balance, b.associated_wallets_balance from (
            select user_id from (
                select user_id, (
                    sum(score) +
                    (:follower_weight * log(case when (follower_count = 0) then 1 else follower_count end)) +
                    (case when (handle=query) then :handle_match_boost else 0 end) +
                    (:name_weight * similarity(coalesce(name, ''), query))) as total_score from (
                        select
                                d."user_id" as user_id,
                                d."word" as word,
                                d."handle" as handle,
                                similarity(d."word", :query) as score,
                                d."user_name" as name,
                                :query as query,
                                d."follower_count" as follower_count
                        from "user_lexeme_dict" d
                        where
                            d."word" % :query OR
                            d."handle" = :query
                ) as results
                group by user_id, name, query, handle, follower_count
            ) as results2
            order by total_score desc, user_id asc
            limit :limit
            offset :offset
        ) as u left join user_balances b on u.user_id = b.user_id
        """
    )

    user_info = session.execute(
        res,
        {
            "query": search_str,
            "limit": limit,
            "offset": offset,
            "name_weight": user_name_weight,
            "follower_weight": user_follower_weight,
            "current_user_id": current_user_id,
            "handle_match_boost": user_handle_exact_match_boost
        },
    ).fetchall()

    # user_ids is list of tuples - simplify to 1-D list
    user_ids = [i[0] for i in user_info]

    users = get_unpopulated_users(session, user_ids)

    if is_auto_complete:
        for i, user in enumerate(users):
            balance = user_info[i][1]
            associated_wallets_balance = user_info[i][2]
            user[response_name_constants.balance] = balance
            user[response_name_constants.associated_wallets_balance] = associated_wallets_balance
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


def playlist_search_query(
        session,
        search_str,
        limit,
        offset,
        is_album,
        personalized,
        is_auto_complete,
        current_user_id):
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
        select p.playlist_id, b.balance, b.associated_wallets_balance from (
            select distinct on (owner_id) playlist_id, owner_id, total_score from (
                select playlist_id, owner_id, (
                    (:similarity_weight * sum(score)) +
                    (:title_weight * similarity(coalesce(playlist_name, ''), query)) +
                    (:user_name_weight * similarity(coalesce(user_name, ''), query)) +
                    (:repost_weight * log(case when (repost_count = 0) then 1 else repost_count end)) +
                    (case when (lower(query) = coalesce(playlist_name, '')) then :title_match_boost else 0 end) +
                    (case when (lower(query) = handle) then :handle_match_boost else 0 end) +
                    (case when (lower(query) = user_name) then :user_name_match_boost else 0 end)
                ) as total_score
                from (
                    select
                        d."playlist_id" as playlist_id, d."word" as word, similarity(d."word", :query) as score,
                        d."playlist_name" as playlist_name, :query as query, d."repost_count" as repost_count,
                        d."handle" as handle, d."user_name" as user_name, d."owner_id" as owner_id
                    from "{table_name}" d
                    {
                        'inner join "saves" s on s.save_item_id = d.playlist_id'
                        if personalized and current_user_id
                        else ""
                    }
                    where (d."word" % lower(:query) or d."handle" = lower(:query) or d."user_name" % lower(:query))
                    {
                        "and s.save_type='" + save_type +
                        "' and s.is_current=true and s.is_delete=false and s.user_id=:current_user_id"
                        if personalized and current_user_id
                        else ""
                    }
                ) as results
                group by playlist_id, playlist_name, query, repost_count, user_name, handle, owner_id
            ) as results2
            order by owner_id, total_score desc
        ) as p left join user_balances b on p.owner_id = b.user_id
        order by total_score desc
        limit :limit
        offset :offset;
        """
    )

    playlist_data = session.execute(
        res,
        {
            "query": search_str,
            "limit": limit,
            "offset": offset,
            "title_weight": search_title_weight,
            "repost_weight": search_repost_weight,
            "similarity_weight": search_similarity_weight,
            "current_user_id": current_user_id,
            "user_name_weight": search_user_name_weight,
            "title_match_boost": search_title_exact_match_boost,
            "handle_match_boost": search_handle_exact_match_boost,
            "user_name_match_boost": search_user_name_exact_match_boost
        },
    ).fetchall()

    # playlist_ids is list of tuples - simplify to 1-D list
    playlist_ids = [i[0] for i in playlist_data]
    playlists = get_unpopulated_playlists(session, playlist_ids, True)

    # TODO: Populate playlist metadata should be sped up to be able to be
    # used in search autocomplete as that'll give us better results.
    if is_auto_complete:
        # fetch users for playlists
        playlist_owner_ids = list(map(lambda playlist: playlist["playlist_owner_id"], playlists))
        users = get_unpopulated_users(session, playlist_owner_ids)
        users_dict = {user["user_id"]: user for user in users}

        # attach user objects to playlist objects
        for i, playlist in enumerate(playlists):
            user = users_dict[playlist["playlist_owner_id"]]
            # Add user balance
            balance = playlist_data[i][1]
            associated_balance = playlist_data[i][2]
            user[response_name_constants.balance] = balance
            user[response_name_constants.associated_wallets_balance] = associated_balance
            playlist["user"] = user

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

    return playlists[0:limit]
