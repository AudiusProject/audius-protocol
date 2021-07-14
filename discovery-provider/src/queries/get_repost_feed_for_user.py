from sqlalchemy import desc

from src.models import Track, Repost, RepostType, Playlist, SaveType, User
from src.utils import helpers
from src.utils.db_session import get_db_read_replica
from src.queries import response_name_constants
from src.queries.query_helpers import (
    paginate_query,
    get_users_by_id,
    get_users_ids,
    populate_playlist_metadata,
    populate_track_metadata,
)


def get_repost_feed_for_user(user_id, args):
    feed_results = {}
    db = get_db_read_replica()
    current_user_id = args.get("current_user_id")

    with db.scoped_session() as session:
        if "handle" in args:
            handle = args.get("handle")
            user_id = (
                session.query(User.user_id)
                .filter(User.handle_lc == handle.lower())
                .first()
            )

        # query all reposts by user
        repost_query = (
            session.query(Repost)
            .filter(
                Repost.is_current == True,
                Repost.is_delete == False,
                Repost.user_id == user_id,
            )
            .order_by(
                desc(Repost.created_at),
                desc(Repost.repost_item_id),
                desc(Repost.repost_type),
            )
        )

        reposts = paginate_query(repost_query).all()

        # get track reposts from above
        track_reposts = [r for r in reposts if r.repost_type == RepostType.track]

        # get reposted track ids
        repost_track_ids = [r.repost_item_id for r in track_reposts]

        # get playlist reposts from above
        playlist_reposts = [
            r
            for r in reposts
            if r.repost_type == RepostType.playlist or r.repost_type == RepostType.album
        ]

        # get reposted playlist ids
        repost_playlist_ids = [r.repost_item_id for r in playlist_reposts]

        track_reposts = helpers.query_result_to_list(track_reposts)
        playlist_reposts = helpers.query_result_to_list(playlist_reposts)

        # build track/playlist id --> repost dict from repost lists
        track_repost_dict = {
            repost["repost_item_id"]: repost for repost in track_reposts
        }
        playlist_repost_dict = {
            repost["repost_item_id"]: repost for repost in playlist_reposts
        }

        # query tracks for repost_track_ids
        track_query = (
            session.query(Track)
            .filter(
                Track.is_current == True,
                Track.is_delete == False,
                Track.is_unlisted == False,
                Track.stem_of == None,
                Track.track_id.in_(repost_track_ids),
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
                Playlist.playlist_id.in_(repost_playlist_ids),
            )
            .order_by(desc(Playlist.created_at))
        )
        playlists = playlist_query.all()
        playlists = helpers.query_result_to_list(playlists)

        # get playlist ids
        playlist_ids = [playlist["playlist_id"] for playlist in playlists]

        # populate full metadata
        tracks = populate_track_metadata(session, track_ids, tracks, current_user_id)
        playlists = populate_playlist_metadata(
            session,
            playlist_ids,
            playlists,
            [RepostType.playlist, RepostType.album],
            [SaveType.playlist, SaveType.album],
            current_user_id,
        )

        # add activity timestamps
        for track in tracks:
            track[response_name_constants.activity_timestamp] = track_repost_dict[
                track["track_id"]
            ]["created_at"]

        for playlist in playlists:
            playlist[response_name_constants.activity_timestamp] = playlist_repost_dict[
                playlist["playlist_id"]
            ]["created_at"]

        unsorted_feed = tracks + playlists

        # sort feed by repost timestamp desc
        feed_results = sorted(
            unsorted_feed,
            key=lambda entry: entry[response_name_constants.activity_timestamp],
            reverse=True,
        )

        if args.get("with_users", False):
            user_id_list = get_users_ids(feed_results)
            users = get_users_by_id(session, user_id_list)
            for result in feed_results:
                if "playlist_owner_id" in result:
                    user = users[result["playlist_owner_id"]]
                    if user:
                        result["user"] = user
                elif "owner_id" in result:
                    user = users[result["owner_id"]]
                    if user:
                        result["user"] = user

    return feed_results
