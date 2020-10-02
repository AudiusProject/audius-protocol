from sqlalchemy import desc, or_

from src.models import Track, Repost, RepostType, Follow, Playlist, Save, SaveType, User
from src.utils import helpers
from src.utils.db_session import get_db_read_replica
from src.queries import response_name_constants
from src.queries.query_helpers import get_current_user_id, get_repost_counts, get_save_counts, \
    paginate_query, get_users_by_id, get_users_ids


def get_repost_feed_for_user(user_id, args):
    feed_results = {}
    db = get_db_read_replica()
    with db.scoped_session() as session:
        if "handle" in args:
            handle = args.get("handle")
            user_id = session.query(User.user_id).filter(User.handle == handle).first()

        # query all reposts by user
        repost_query = (
            session.query(Repost)
            .filter(
                Repost.is_current == True,
                Repost.is_delete == False,
                Repost.user_id == user_id
            )
            .order_by(desc(Repost.created_at), desc(Repost.repost_item_id), desc(Repost.repost_type))
        )

        reposts = paginate_query(repost_query).all()

        # get track reposts from above
        track_reposts = [
            r for r in reposts if r.repost_type == RepostType.track]

        # get reposted track ids
        repost_track_ids = [r.repost_item_id for r in track_reposts]

        # get playlist reposts from above
        playlist_reposts = [
            r for r in reposts
            if r.repost_type == RepostType.playlist or r.repost_type == RepostType.album
        ]

        # get reposted playlist ids
        repost_playlist_ids = [r.repost_item_id for r in playlist_reposts]

        track_reposts = helpers.query_result_to_list(track_reposts)
        playlist_reposts = helpers.query_result_to_list(playlist_reposts)

        # build track/playlist id --> repost dict from repost lists
        track_repost_dict = {repost["repost_item_id"]: repost for repost in track_reposts}
        playlist_repost_dict = {
            repost["repost_item_id"]: repost for repost in playlist_reposts}

        # query tracks for repost_track_ids
        track_query = (
            session.query(Track)
            .filter(
                Track.is_current == True,
                Track.is_delete == False,
                Track.is_unlisted == False,
                Track.stem_of == None,
                Track.track_id.in_(repost_track_ids)
            )
            .order_by(desc(Track.created_at))
        )
        tracks = track_query.all()
        tracks = helpers.query_result_to_list(tracks)

        # get track ids
        track_ids = [track["track_id"] for track in tracks]

        # query playlists for repost_playlist_ids
        playlist_query = (
            session.query(Playlist)
            .filter(
                Playlist.is_current == True,
                Playlist.is_delete == False,
                Playlist.is_private == False,
                Playlist.playlist_id.in_(repost_playlist_ids)
            )
            .order_by(desc(Playlist.created_at))
        )
        playlists = playlist_query.all()
        playlists = helpers.query_result_to_list(playlists)

        # get playlist ids
        playlist_ids = [playlist["playlist_id"] for playlist in playlists]

        # get repost counts by track and playlist IDs
        repost_counts = get_repost_counts(
            session, False, True, track_ids + playlist_ids, None)
        track_repost_counts = {
            repost_item_id: repost_count
            for (repost_item_id, repost_count, repost_type) in repost_counts
            if repost_type == RepostType.track
        }
        playlist_repost_counts = {
            repost_item_id: repost_count
            for (repost_item_id, repost_count, repost_type) in repost_counts
            if repost_type in (RepostType.playlist, RepostType.album)
        }

        # get save counts for tracks and playlists
        save_counts = get_save_counts(
            session, False, True, track_ids + playlist_ids, None)
        track_save_counts = {
            save_item_id: save_count
            for (save_item_id, save_count, save_type) in save_counts
            if save_type == SaveType.track
        }
        playlist_save_counts = {
            save_item_id: save_count
            for (save_item_id, save_count, save_type) in save_counts
            if save_type in (SaveType.playlist, SaveType.album)
        }

        current_user_id = get_current_user_id(required=False)
        requested_user_is_current_user = False
        user_reposted_track_ids = {}
        user_reposted_playlist_ids = {}
        user_saved_track_dict = {}
        user_saved_playlist_dict = {}
        followees_track_repost_dict = {}
        followees_playlist_repost_dict = {}
        if current_user_id:
            # if current user = user_id, skip current_user_reposted queries and default to true
            if current_user_id == user_id:
                requested_user_is_current_user = True
            else:
                user_reposted_query = (
                    session.query(Repost.repost_item_id, Repost.repost_type)
                    .filter(
                        Repost.is_current == True,
                        Repost.is_delete == False,
                        Repost.user_id == current_user_id,
                        or_(Repost.repost_item_id.in_(track_ids),
                            Repost.repost_item_id.in_(playlist_ids))
                    )
                    .all()
                )

                # generate dictionary of track id --> current user reposted status
                user_reposted_track_ids = {
                    r[0]: True
                    for r in user_reposted_query if r[1] == RepostType.track
                }

                # generate dictionary of playlist id --> current user reposted status
                user_reposted_playlist_ids = {
                    r[0]: True
                    for r in user_reposted_query if r[1] == RepostType.album or r[1] == RepostType.playlist
                }

            # build dict of tracks and playlists that current user has saved

            #   - query saves by current user from relevant tracks/playlists
            user_saved_query = (
                session.query(Save.save_item_id, Save.save_type)
                .filter(
                    Save.is_current == True,
                    Save.is_delete == False,
                    Save.user_id == current_user_id,
                    or_(Save.save_item_id.in_(track_ids),
                        Save.save_item_id.in_(playlist_ids))
                )
                .all()
            )
            #   - build dict of track id --> current user save status
            user_saved_track_dict = {
                save[0]: True
                for save in user_saved_query if save[1] == SaveType.track
            }
            #   - build dict of playlist id --> current user save status
            user_saved_playlist_dict = {
                save[0]: True
                for save in user_saved_query if save[1] == SaveType.playlist or save[1] == SaveType.album
            }

            # query current user's followees
            followee_user_ids = (
                session.query(Follow.followee_user_id)
                .filter(
                    Follow.follower_user_id == current_user_id,
                    Follow.is_current == True,
                    Follow.is_delete == False
                )
                .all()
            )
            followee_user_ids = [f[0] for f in followee_user_ids]

            # query all followees' reposts
            followee_repost_query = (
                session.query(Repost)
                .filter(
                    Repost.is_current == True,
                    Repost.is_delete == False,
                    Repost.user_id.in_(followee_user_ids),
                    or_(Repost.repost_item_id.in_(repost_track_ids),
                        Repost.repost_item_id.in_(repost_playlist_ids))
                )
                .order_by(desc(Repost.created_at))
            )
            followee_reposts = paginate_query(followee_repost_query).all()
            followee_reposts = helpers.query_result_to_list(followee_reposts)

            # build dict of track id --> reposts from followee track reposts
            for repost in followee_reposts:
                if repost["repost_type"] == RepostType.track:
                    if repost["repost_item_id"] not in followees_track_repost_dict:
                        followees_track_repost_dict[repost["repost_item_id"]] = [
                        ]
                    followees_track_repost_dict[repost["repost_item_id"]].append(
                        repost)

            # build dict of playlist id --> reposts from followee playlist reposts
            for repost in followee_reposts:
                if (repost["repost_type"] == RepostType.playlist or repost["repost_type"] == RepostType.album):
                    if repost["repost_item_id"] not in followees_playlist_repost_dict:
                        followees_playlist_repost_dict[repost["repost_item_id"]] = [
                        ]
                    followees_playlist_repost_dict[repost["repost_item_id"]].append(
                        repost)

        # populate metadata for track entries
        for track in tracks:
            track[response_name_constants.repost_count] = track_repost_counts.get(
                track["track_id"], 0)
            track[response_name_constants.save_count] = track_save_counts.get(
                track["track_id"], 0)
            track[response_name_constants.has_current_user_reposted] = (
                True if requested_user_is_current_user
                else user_reposted_track_ids.get(track["track_id"], False)
            )
            track[response_name_constants.has_current_user_saved] = user_saved_track_dict.get(
                track["track_id"], False)
            track[response_name_constants.followee_reposts] = followees_track_repost_dict.get(
                track["track_id"], [])
            track[response_name_constants.followee_saves] = []
            track[response_name_constants.activity_timestamp] = track_repost_dict[track["track_id"]]["created_at"]

        for playlist in playlists:
            playlist[response_name_constants.repost_count] = playlist_repost_counts.get(
                playlist["playlist_id"], 0)
            playlist[response_name_constants.save_count] = playlist_save_counts.get(
                playlist["playlist_id"], 0)
            playlist[response_name_constants.has_current_user_reposted] = (
                True if requested_user_is_current_user
                else user_reposted_playlist_ids.get(playlist["playlist_id"], False)
            )
            playlist[response_name_constants.has_current_user_saved] = \
                user_saved_playlist_dict.get(playlist["playlist_id"], False)
            playlist[response_name_constants.followee_reposts] = \
                followees_playlist_repost_dict.get(playlist["playlist_id"], [])
            playlist[response_name_constants.followee_saves] = []
            playlist[response_name_constants.activity_timestamp] = \
                playlist_repost_dict[playlist["playlist_id"]]["created_at"]

        unsorted_feed = tracks + playlists

        # sort feed by repost timestamp desc
        feed_results = sorted(
            unsorted_feed, key=lambda entry: entry[response_name_constants.activity_timestamp], reverse=True)

        if args.get("with_users", False):
            user_id_list = get_users_ids(feed_results)
            users = get_users_by_id(session, user_id_list)
            for result in feed_results:
                if 'playlist_owner_id' in result:
                    user = users[result['playlist_owner_id']]
                    if user:
                        result['user'] = user
                elif 'owner_id' in result:
                    user = users[result['owner_id']]
                    if user:
                        result['user'] = user

    return feed_results
