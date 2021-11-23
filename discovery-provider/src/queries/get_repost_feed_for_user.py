from typing import Optional, TypedDict, cast
from sqlalchemy import desc
from sqlalchemy.orm.session import Session
from sqlalchemy.sql.elements import and_, or_

from src.models import Track, Repost, RepostType, Playlist, SaveType, User
from src.utils import helpers
from src.utils.db_session import get_db_read_replica
from src.queries import response_name_constants
from src.queries.query_helpers import (
    add_query_pagination,
    get_users_by_id,
    get_users_ids,
    populate_playlist_metadata,
    populate_track_metadata,
)


class GetRepostFeedForUserArgs(TypedDict):
    offset: int
    limit: int
    handle: Optional[str]
    current_user_id: Optional[int]
    with_suers: Optional[bool]


def get_repost_feed_for_user(user_id: int, args: GetRepostFeedForUserArgs):
    """
    Gets the repost feed for a user (e.g. stalking a user)

    Args:
        user_id: number The user id to request the repost feed for
        args: GetRepostFeedForUserArgs The parsed args from the request

    Returns:
        Array of tracks and playlists (albums) interspersed ordered by
        most recent repost
    """
    db = get_db_read_replica()
    with db.scoped_session() as session:
        return _get_repost_feed_for_user(session, user_id, args)


def _get_repost_feed_for_user(
    session: Session, user_id: int, args: GetRepostFeedForUserArgs
):
    feed_results = []
    current_user_id = args.get("current_user_id")
    limit = args.get("limit")
    offset = args.get("offset")
    if "handle" in args:
        handle = args.get("handle") or ""
        user_id = cast(
            int,
            session.query(User.user_id)
            .filter(User.handle_lc == handle.lower())
            .first(),
        )

    # Query all reposts by a user.
    # Outerjoin both tracks and playlists to collect both
    # so that a single limit/offset pagination does what we intend when tracks or playlists
    # are deleted.
    repost_query = (
        session.query(Repost, Track, Playlist)
        .outerjoin(
            Track,
            and_(
                Repost.repost_item_id == Track.track_id,
                Repost.repost_type == "track",
                Track.is_current == True,
                Track.is_delete == False,
                Track.is_unlisted == False,
                Track.stem_of == None,
            ),
        )
        .outerjoin(
            Playlist,
            and_(
                Repost.repost_item_id == Playlist.playlist_id,
                or_(Repost.repost_type == "playlist", Repost.repost_type == "album"),
                Playlist.is_current == True,
                Playlist.is_delete == False,
                Playlist.is_private == False,
            ),
        )
        .filter(
            Repost.is_current == True,
            Repost.is_delete == False,
            Repost.user_id == user_id,
            # Drop rows that have no join found for either track or playlist
            or_(Track.track_id != None, Playlist.playlist_id != None),
        )
        .order_by(
            desc(Repost.created_at),
            desc(Repost.repost_item_id),
            desc(Repost.repost_type),
        )
    )

    reposts = add_query_pagination(repost_query, limit, offset).all()
    # get track reposts from above
    track_reposts = [r[0] for r in reposts if r[1] is not None]
    track_reposts = helpers.query_result_to_list(track_reposts)

    # get playlist reposts from above
    playlist_reposts = [r[0] for r in reposts if r[2] is not None]
    playlist_reposts = helpers.query_result_to_list(playlist_reposts)

    # build track/playlist id --> repost dict from repost lists
    track_repost_dict = {repost["repost_item_id"]: repost for repost in track_reposts}
    playlist_repost_dict = {
        repost["repost_item_id"]: repost for repost in playlist_reposts
    }

    tracks = helpers.query_result_to_list(
        filter(None, [repost[1] for repost in reposts])
    )
    playlists = helpers.query_result_to_list(
        filter(None, [repost[2] for repost in reposts])
    )

    # get track ids
    track_ids = [track["track_id"] for track in tracks]

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
