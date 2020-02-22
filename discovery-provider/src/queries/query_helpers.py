import logging # pylint: disable=C0302
import json
import requests
from sqlalchemy import func, desc, text
from urllib.parse import urljoin

from flask import request

from src import exceptions
from src.queries import response_name_constants
from src.models import User, Track, Repost, RepostType, Follow, Playlist, Save, SaveType
from src.utils import helpers
from src.utils.config import shared_config

from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


######## VARS ########


defaultLimit = 100
minLimit = 1
maxLimit = 500
defaultOffset = 0
minOffset = 0

# Used when generating genre list to special case Electronic tunes
electronic_sub_genres = [
  'Techno',
  'Trap',
  'House',
  'Tech House',
  'Deep House',
  'Disco',
  'Electro',
  'Jungle',
  'Progressive House',
  'Hardstyle',
  'Glitch Hop',
  'Trance',
  'Future Bass',
  'Future House',
  'Tropical House',
  'Downtempo',
  'Drum & Bass',
  'Dubstep',
  'Jersey Club',
]

######## HELPERS ########


def get_current_user_id(required=True):
    user_id_header = 'X-User-ID'
    uid = request.headers.get(user_id_header)
    try:
        if uid:
            uid = int(uid)
    except ValueError:
        raise exceptions.ArgumentError("must be valid integer")
    if required and not uid:
        raise exceptions.ArgumentError("Need to include valid X-User-ID header")

    return uid


def parse_sort_param(base_query, model, whitelist_sort_params):
    sort = request.args.get("sort")
    if not sort:
        return base_query

    params = sort.split(',')
    try:
        params = {param[0]: param[1] for param in [p.split(':') for p in params]}
    except IndexError:
        raise exceptions.ArgumentError("Need to specify :asc or :desc on all parameters")
    order_bys = []
    for field in params.keys():
        if field not in whitelist_sort_params:
            raise exceptions.ArgumentError('Parameter %s is invalid in sort' % field)
        attr = getattr(model, field)
        if params[field] == 'desc':
            attr = attr.desc()
        else:
            attr = attr.asc()
        order_bys.append(attr)

    return base_query.order_by(*order_bys)


# given list of user ids and corresponding users, populates each user object with:
#   track_count, playlist_count, album_count, follower_count, followee_count, repost_count
#   if current_user_id available, populates does_current_user_follow, followee_follows
def populate_user_metadata(session, user_ids, users, current_user_id):
    # build dict of user id --> track count
    track_counts = (
        session.query(
            Track.owner_id,
            func.count(Track.owner_id)
        )
        .filter(
            Track.is_current == True,
            Track.is_delete == False,
            Track.is_unlisted == False,
            Track.owner_id.in_(user_ids)
        )
        .group_by(Track.owner_id)
        .all()
    )
    track_count_dict = {user_id: track_count for (user_id, track_count) in track_counts}

    # build dict of user id --> playlist count
    playlist_counts = (
        session.query(
            Playlist.playlist_owner_id,
            func.count(Playlist.playlist_owner_id)
        )
        .filter(
            Playlist.is_current == True,
            Playlist.is_album == False,
            Playlist.is_private == False,
            Playlist.is_delete == False,
            Playlist.playlist_owner_id.in_(user_ids)
        )
        .group_by(Playlist.playlist_owner_id)
        .all()
    )
    playlist_count_dict = {user_id: playlist_count for (user_id, playlist_count) in playlist_counts}

    # build dict of user id --> album count
    album_counts = (
        session.query(
            Playlist.playlist_owner_id,
            func.count(Playlist.playlist_owner_id)
        )
        .filter(
            Playlist.is_current == True,
            Playlist.is_album == True,
            Playlist.is_private == False,
            Playlist.is_delete == False,
            Playlist.playlist_owner_id.in_(user_ids)
        )
        .group_by(Playlist.playlist_owner_id)
        .all()
    )
    album_count_dict = {user_id: album_count for (user_id, album_count) in album_counts}

    # build dict of user id --> follower count
    follower_counts = (
        session.query(
            Follow.followee_user_id,
            func.count(Follow.followee_user_id)
        )
        .filter(
            Follow.is_current == True,
            Follow.is_delete == False,
            Follow.followee_user_id.in_(user_ids)
        )
        .group_by(Follow.followee_user_id)
        .all()
    )
    follower_count_dict = {user_id: follower_count for (user_id, follower_count) in follower_counts}

    # build dict of user id --> followee count
    followee_counts = (
        session.query(
            Follow.follower_user_id,
            func.count(Follow.follower_user_id)
        )
        .filter(
            Follow.is_current == True,
            Follow.is_delete == False,
            Follow.follower_user_id.in_(user_ids)
        )
        .group_by(Follow.follower_user_id)
        .all()
    )
    followee_count_dict = {user_id: followee_count for (user_id, followee_count) in followee_counts}

    # build dict of user id --> repost count
    repost_counts = (
        session.query(
            Repost.user_id,
            func.count(Repost.user_id)
        )
        .filter(
            Repost.is_current == True,
            Repost.is_delete == False,
            Repost.user_id.in_(user_ids)
        )
        .group_by(Repost.user_id)
        .all()
    )
    repost_count_dict = {user_id: repost_count for (user_id, repost_count) in repost_counts}

    # build dict of user id --> track blocknumber
    track_blocknumbers = (
        session.query(
            Track.owner_id,
            func.max(Track.blocknumber)
        )
        .filter(
            Track.is_current == True,
            Track.is_delete == False,
            Track.owner_id.in_(user_ids)
        )
        .group_by(Track.owner_id)
        .all()
    )
    track_blocknumber_dict = {user_id: track_blocknumber for (user_id, track_blocknumber) in track_blocknumbers}

    current_user_followed_user_ids = {}
    current_user_followee_follow_count_dict = {}
    if current_user_id:
        # does current user follow any of requested user ids
        current_user_followed_user_ids = (
            session.query(Follow.followee_user_id)
            .filter(
                Follow.is_current == True,
                Follow.is_delete == False,
                Follow.followee_user_id.in_(user_ids),
                Follow.follower_user_id == current_user_id
            )
            .all()
        )
        current_user_followed_user_ids = {r[0]: True for r in current_user_followed_user_ids}

        # build dict of user id --> followee follow count
        current_user_followees = (
            session.query(Follow.followee_user_id)
            .filter(
                Follow.is_current == True,
                Follow.is_delete == False,
                Follow.follower_user_id == current_user_id
            )
        )
        current_user_followees = {r[0]: True for r in current_user_followees}

        current_user_followee_follow_counts = (
            session.query(
                Follow.followee_user_id,
                func.count(Follow.followee_user_id)
            )
            .filter(
                Follow.is_current == True,
                Follow.is_delete == False,
                Follow.follower_user_id.in_(current_user_followees),
                Follow.followee_user_id.in_(user_ids)
            )
            .group_by(Follow.followee_user_id)
            .all()
        )
        current_user_followee_follow_count_dict = {user_id: followee_follow_count for (user_id, followee_follow_count) in current_user_followee_follow_counts}

    for user in users:
        user_id = user["user_id"]
        user[response_name_constants.track_count] = track_count_dict.get(user_id, 0)
        user[response_name_constants.playlist_count] = playlist_count_dict.get(user_id, 0)
        user[response_name_constants.album_count] = album_count_dict.get(user_id, 0)
        user[response_name_constants.follower_count] = follower_count_dict.get(user_id, 0)
        user[response_name_constants.followee_count] = followee_count_dict.get(user_id, 0)
        user[response_name_constants.repost_count] = repost_count_dict.get(user_id, 0)
        user[response_name_constants.track_blocknumber] = track_blocknumber_dict.get(user_id, -1)
        # current user specific
        user[response_name_constants.does_current_user_follow] = current_user_followed_user_ids.get(user_id, False)
        user[response_name_constants.current_user_followee_follow_count] = current_user_followee_follow_count_dict.get(user_id, 0)

    return users


# given list of track ids and corresponding tracks, populates each track object with:
#   repost_count, save_count
#   if current_user_id available, populates followee_reposts, has_current_user_reposted, has_current_user_saved
def populate_track_metadata(session, track_ids, tracks, current_user_id):
    # build dict of track id --> repost count
    repost_counts = (
        session.query(
            Repost.repost_item_id,
            func.count(Repost.repost_item_id)
        )
        .filter(
            Repost.is_current == True,
            Repost.is_delete == False,
            Repost.repost_item_id.in_(track_ids),
            Repost.repost_type == RepostType.track
        )
        .group_by(Repost.repost_item_id)
        .all()
    )
    repost_count_dict = {track_id: repost_count for (track_id, repost_count) in repost_counts}

    # build dict of track id --> save count
    save_counts = (
        session.query(
            Save.save_item_id,
            func.count(Save.save_item_id)
        )
        .filter(
            Save.is_current == True,
            Save.is_delete == False,
            Save.save_type == SaveType.track,
            Save.save_item_id.in_(track_ids)
        )
        .group_by(Save.save_item_id)
        .all()
    )
    save_count_dict = {track_id: save_count for (track_id, save_count) in save_counts}

    user_reposted_track_dict = {}
    user_saved_track_dict = {}
    followee_track_repost_dict = {}
    followee_track_save_dict = {}
    if current_user_id:
        # has current user reposted any of requested track ids
        user_reposted = (
            session.query(
                Repost.repost_item_id
            )
            .filter(
                Repost.is_current == True,
                Repost.is_delete == False,
                Repost.repost_item_id.in_(track_ids),
                Repost.repost_type == RepostType.track,
                Repost.user_id == current_user_id
            )
            .all()
        )
        user_reposted_track_dict = {repost[0]: True for repost in user_reposted}

        # has current user saved any of requested track ids
        user_saved_tracks_query = (
            session.query(Save.save_item_id)
            .filter(
                Save.is_current == True,
                Save.is_delete == False,
                Save.user_id == current_user_id,
                Save.save_item_id.in_(track_ids),
                Save.save_type == SaveType.track
            )
            .all()
        )
        user_saved_track_dict = {save[0]: True for save in user_saved_tracks_query}

        # Get current user's followees.
        followees = (
            session.query(Follow.followee_user_id)
            .filter(
                Follow.follower_user_id == current_user_id,
                Follow.is_current == True,
                Follow.is_delete == False
            )
        )

        # build dict of track id --> followee reposts
        followee_track_reposts = (
            session.query(Repost)
            .filter(
                Repost.is_current == True,
                Repost.is_delete == False,
                Repost.repost_item_id.in_(track_ids),
                Repost.repost_type == RepostType.track,
                Repost.user_id.in_(followees)
            )
        )
        followee_track_reposts = helpers.query_result_to_list(followee_track_reposts)
        for track_repost in followee_track_reposts:
            if track_repost["repost_item_id"] not in followee_track_repost_dict:
                followee_track_repost_dict[track_repost["repost_item_id"]] = []
            followee_track_repost_dict[track_repost["repost_item_id"]].append(track_repost)
        
        # Build dict of track id --> followee saves.
        followee_track_saves = (
            session.query(Save)
            .filter(
                Save.is_current == True,
                Save.is_delete == False,
                Save.save_item_id.in_(track_ids),
                Save.save_type == SaveType.track,
                Save.user_id.in_(followees)
            )
        )
        followee_track_saves = helpers.query_result_to_list(followee_track_saves)
        for track_save in followee_track_saves:
            if track_save["save_item_id"] not in followee_track_save_dict:
                followee_track_save_dict[track_save["save_item_id"]] = []
            followee_track_save_dict[track_save["save_item_id"]].append(track_save)

    for track in tracks:
        track_id = track["track_id"]
        track[response_name_constants.repost_count] = repost_count_dict.get(track_id, 0)
        track[response_name_constants.save_count] = save_count_dict.get(track_id, 0)
        # current user specific
        track[response_name_constants.followee_reposts] = followee_track_repost_dict.get(track_id, [])
        track[response_name_constants.followee_saves] = followee_track_save_dict.get(track_id, [])
        track[response_name_constants.has_current_user_reposted] = user_reposted_track_dict.get(track_id, False)
        track[response_name_constants.has_current_user_saved] = user_saved_track_dict.get(track['track_id'], False)

    return tracks


# given list of playlist ids and corresponding playlists, populates each playlist object with:
#   repost_count, save_count
#   if current_user_id available, populates followee_reposts, has_current_user_reposted, has_current_user_saved
def populate_playlist_metadata(session, playlist_ids, playlists, repost_types, save_types, current_user_id):
    # build dict of playlist id --> repost count
    playlist_repost_counts = dict(get_repost_counts(session, False, False, playlist_ids, repost_types))

    # build dict of playlist id --> save count
    playlist_save_counts = dict(get_save_counts(session, False, False, playlist_ids, save_types))

    user_reposted_playlist_dict = {}
    user_saved_playlist_dict = {}
    followee_playlist_repost_dict = {}
    followee_playlist_save_dict = {}
    if current_user_id:
        # has current user reposted any of requested playlist ids
        current_user_playlist_reposts = (
            session.query(Repost.repost_item_id)
            .filter(
                Repost.is_current == True,
                Repost.is_delete == False,
                Repost.repost_item_id.in_(playlist_ids),
                Repost.repost_type.in_(repost_types),
                Repost.user_id == current_user_id
            )
            .all()
        )
        user_reposted_playlist_dict = {r[0]: True for r in current_user_playlist_reposts}

        # has current user saved any of requested playlist ids
        user_saved_playlists_query = (
            session.query(Save.save_item_id)
            .filter(
                Save.is_current == True,
                Save.is_delete == False,
                Save.user_id == current_user_id,
                Save.save_item_id.in_(playlist_ids),
                Save.save_type.in_(save_types)
            )
            .all()
        )
        user_saved_playlist_dict = {save[0]: True for save in user_saved_playlists_query}

        # Get current user's followees.
        followee_user_ids = (
            session.query(Follow.followee_user_id)
            .filter(
                Follow.follower_user_id == current_user_id,
                Follow.is_current == True,
                Follow.is_delete == False
            )
            .all()
        )
        
        # Build dict of playlist id --> followee reposts.
        followee_playlist_reposts = (
            session.query(Repost)
            .filter(
                Repost.is_current == True,
                Repost.is_delete == False,
                Repost.repost_item_id.in_(playlist_ids),
                Repost.repost_type.in_(repost_types),
                Repost.user_id.in_(followee_user_ids)
            )
            .all()
        )
        followee_playlist_reposts = helpers.query_result_to_list(followee_playlist_reposts)
        for playlist_repost in followee_playlist_reposts:
            if playlist_repost["repost_item_id"] not in followee_playlist_repost_dict:
                followee_playlist_repost_dict[playlist_repost["repost_item_id"]] = []
            followee_playlist_repost_dict[playlist_repost["repost_item_id"]].append(playlist_repost)
        
        # Build dict of playlist id --> followee saves.
        followee_playlist_saves = (
            session.query(Save)
            .filter(
                Save.is_current == True,
                Save.is_delete == False,
                Save.save_item_id.in_(playlist_ids),
                Save.save_type.in_(save_types),
                Save.user_id.in_(followee_user_ids)
            )
            .all()
        )
        followee_playlist_saves = helpers.query_result_to_list(followee_playlist_saves)
        for playlist_save in followee_playlist_saves:
            if playlist_save["save_item_id"] not in followee_playlist_save_dict:
                followee_playlist_save_dict[playlist_save["save_item_id"]] = []
            followee_playlist_save_dict[playlist_save["save_item_id"]].append(playlist_save)

    for playlist in playlists:
        playlist_id = playlist["playlist_id"]
        playlist[response_name_constants.repost_count] = playlist_repost_counts.get(playlist_id, 0)
        playlist[response_name_constants.save_count] = playlist_save_counts.get(playlist_id, 0)
        # current user specific
        playlist[response_name_constants.followee_reposts] = followee_playlist_repost_dict.get(playlist_id, [])
        playlist[response_name_constants.followee_saves] = followee_playlist_save_dict.get(playlist_id, [])
        playlist[response_name_constants.has_current_user_reposted] = \
            user_reposted_playlist_dict.get(playlist_id, False)
        playlist[response_name_constants.has_current_user_saved] = user_saved_playlist_dict.get(playlist_id, False)

    return playlists

def get_repost_counts_query(session, query_by_user_flag, query_repost_type_flag, filter_ids, repost_types, max_block_number=None):
    query_col = Repost.user_id if query_by_user_flag else Repost.repost_item_id

    repost_counts_query = None
    if query_repost_type_flag:
        repost_counts_query = session.query(
            query_col,
            func.count(query_col),
            Repost.repost_type
        )
    else:
        repost_counts_query = session.query(
            query_col,
            func.count(query_col),
        )

    repost_counts_query = repost_counts_query.filter(
        Repost.is_current == True,
        Repost.is_delete == False
    )

    if filter_ids:
        repost_counts_query = repost_counts_query.filter(
            query_col.in_(filter_ids)
        )
    if repost_types:
        repost_counts_query = repost_counts_query.filter(
            Repost.repost_type.in_(repost_types)
        )

    if query_repost_type_flag:
        repost_counts_query = repost_counts_query.group_by(
            query_col,
            Repost.repost_type
        )
    else:
        repost_counts_query = repost_counts_query.group_by(
            query_col
        )

    if max_block_number:
        repost_counts_query = repost_counts_query.filter(
            Repost.blocknumber <= max_block_number
        )

    return repost_counts_query

def get_repost_counts(session, query_by_user_flag, query_repost_type_flag, filter_ids, repost_types, max_block_number=None):
    repost_counts_query = get_repost_counts_query(session, query_by_user_flag, query_repost_type_flag, filter_ids, repost_types)
    return repost_counts_query.all()


def get_repost_counts_with_time(session, query_by_user_flag, query_repost_type_flag, filter_ids, repost_types, time, max_block_number=None):
    repost_counts_query = get_repost_counts_query(session, query_by_user_flag, query_repost_type_flag, filter_ids, repost_types)
    interval = "NOW() - interval '1 {}'".format(time)
    repost_counts_query = repost_counts_query.filter(
                Repost.created_at >= text(interval)
            )

    return repost_counts_query.all()


def get_save_counts(session, query_by_user_flag, query_save_type_flag, filter_ids, save_types, max_block_number=None):
    query_col = Save.user_id if query_by_user_flag else Save.save_item_id

    save_counts_query = None
    if query_save_type_flag:
        save_counts_query = session.query(
            query_col,
            func.count(query_col),
            Save.save_type
        )
    else:
        save_counts_query = session.query(
            query_col,
            func.count(query_col),
        )

    save_counts_query = save_counts_query.filter(
        Save.is_current == True,
        Save.is_delete == False
    )

    if filter_ids:
        save_counts_query = save_counts_query.filter(
            Save.save_item_id.in_(filter_ids)
        )
    if save_types:
        save_counts_query = save_counts_query.filter(
            Save.save_type.in_(save_types)
        )

    if query_save_type_flag:
        save_counts_query = save_counts_query.group_by(
            query_col,
            Save.save_type
        )
    else:
        save_counts_query = save_counts_query.group_by(
            query_col
        )

    if max_block_number:
        save_counts_query = save_counts_query.filter(
            Save.blocknumber <= max_block_number
        )

    return save_counts_query.all()


def get_followee_count_dict(session, user_ids):
    # build dict of user id --> followee count
    followee_counts = (
        session.query(
            Follow.follower_user_id,
            func.count(Follow.follower_user_id)
        )
        .filter(
            Follow.is_current == True,
            Follow.is_delete == False,
            Follow.follower_user_id.in_(user_ids)
        )
        .group_by(Follow.follower_user_id)
        .all()
    )
    followee_count_dict = {user_id: followee_count for (user_id, followee_count) in followee_counts}
    return followee_count_dict

def get_follower_count_dict(session, user_ids, max_block_number=None):
    follower_counts = (
        session.query(
            Follow.followee_user_id,
            func.count(Follow.followee_user_id)
        )
        .filter(
            Follow.is_current == True,
            Follow.is_delete == False,
            Follow.followee_user_id.in_(user_ids)
        )
    )

    if max_block_number:
        follower_counts = follower_counts.filter(Follow.blocknumber <= max_block_number)

    follower_counts = (
        follower_counts.group_by(Follow.followee_user_id).all()
    )

    follower_count_dict = \
            {user_id: follower_count for (user_id, follower_count) in follower_counts}
    return follower_count_dict


def get_track_play_counts(track_ids):
    track_listen_counts = {}

    if not track_ids:
        return track_listen_counts

    identity_url = shared_config['discprov']['identity_service_url']
    # Create and query identity service endpoint
    identity_tracks_endpoint = urljoin(identity_url, 'tracks/listens')

    post_body = {}
    post_body['track_ids'] = track_ids
    try:
        resp = requests.post(identity_tracks_endpoint, json=post_body)
    except Exception as e:
        logger.error(
            f'Error retrieving play count - {identity_tracks_endpoint}, {e}'
        )
        return track_listen_counts

    json_resp = resp.json()
    keys = list(resp.json().keys())
    if not keys:
        return track_listen_counts

    # Scenario should never arise, since we don't impose date parameter on initial query
    if len(keys) != 1:
        raise Exception('Invalid number of keys')

    # Parse listen query results into track listen count dictionary
    date_key = keys[0]
    listen_count_json = json_resp[date_key]
    if 'listenCounts' in listen_count_json:
        for listen_info in listen_count_json['listenCounts']:
            current_id = listen_info['trackId']
            track_listen_counts[current_id] = listen_info['listens']
    return track_listen_counts

def get_pagination_vars():
    limit = min(
        max(request.args.get("limit", default=defaultLimit, type=int), minLimit),
        maxLimit,
    )
    offset = max(request.args.get("offset", default=defaultOffset, type=int), minOffset)
    return (limit, offset)


def paginate_query(query_obj, apply_offset=True):
    (limit, offset) = get_pagination_vars()
    query_obj = query_obj.limit(limit)
    return query_obj.offset(offset) if apply_offset else query_obj

def get_genre_list(genre):
    genre_list = []
    genre_list.append(genre)
    if genre == 'Electronic':
        genre_list = genre_list + electronic_sub_genres
    return genre_list

def get_users_by_id(session, user_ids):
    user_query = session.query(User).filter(User.is_current == True, User.wallet != None, User.handle != None)
    users_results = user_query.filter(User.user_id.in_(user_ids)).all()
    users = helpers.query_result_to_list(users_results)

    current_user_id = get_current_user_id(required=False)
    # bundle peripheral info into user results
    populated_users = populate_user_metadata(session, user_ids, users, current_user_id)
    user_map = {}
    for user in populated_users:
        user_map[user['user_id']] = user

    return user_map

# Given an array of tracks and/or playlists, return an array of unique user ids
def get_users_ids(results):
    user_ids = []
    for result in results:
        if 'playlist_owner_id' in result:
            user_ids.append(int(result["playlist_owner_id"]))
        elif 'owner_id' in result:
            user_ids.append(int(result['owner_id']))
    # Remove duplicate user ids
    user_ids = list(set(user_ids))
    return user_ids
