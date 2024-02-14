import enum
import logging
from typing import Optional, TypedDict

from sqlalchemy import desc

from src import exceptions
from src.models.playlists.aggregate_playlist import AggregatePlaylist
from src.models.playlists.playlist import Playlist
from src.models.social.repost import RepostType
from src.models.social.save import SaveType
from src.queries.get_top_playlists_es import get_top_playlists_es
from src.queries.query_helpers import (
    create_followee_playlists_subquery,
    decayed_score,
    filter_to_playlist_mood,
    get_current_user_id,
    get_users_by_id,
    get_users_ids,
    populate_playlist_metadata,
)
from src.utils import helpers
from src.utils.db_session import get_db_read_replica
from src.utils.elasticdsl import esclient

logger = logging.getLogger(__name__)


class GetTopPlaylistsArgs(TypedDict):
    current_user_id: Optional[int]
    limit: Optional[int]
    mood: Optional[str]
    filter: Optional[str]
    with_users: Optional[bool]


class TopPlaylistKind(str, enum.Enum):
    playlist = "playlist"
    album = "album"


def get_top_playlists(kind: TopPlaylistKind, args: GetTopPlaylistsArgs):
    skip_es = args.get("es") == "0"
    use_es = esclient and not skip_es
    if use_es:
        try:
            return get_top_playlists_es(kind, args)
        except Exception as e:
            logger.error(f"elasticsearch get_top_playlists_es failed: {e}")

    return get_top_playlists_sql(kind, args)


def get_top_playlists_sql(kind: TopPlaylistKind, args: GetTopPlaylistsArgs):
    current_user_id = args.get("current_user_id")

    # NOTE: This is a temporary fix while migrating clients to pass
    # along an encoded user id via url param
    if current_user_id is None:
        current_user_id = get_current_user_id(required=False)

    # Argument parsing and checking
    if kind not in ("playlist", "album"):
        raise exceptions.ArgumentError(
            "Invalid kind provided, must be one of 'playlist', 'album'"
        )

    limit = args.get("limit", 16)
    mood = args.get("mood", None)

    if args.get("filter") is not None:
        query_filter = args.get("filter")
        if query_filter != "followees":
            raise exceptions.ArgumentError(
                "Invalid filter provided, must be one of 'followees'"
            )
        if query_filter == "followees":
            if not current_user_id:
                raise exceptions.ArgumentError(
                    "User id required to query for followees"
                )
    else:
        query_filter = None

    db = get_db_read_replica()
    with db.scoped_session() as session:
        # If filtering by followees, set the playlist view to be only playlists from
        # users that the current user follows.
        if query_filter == "followees":
            playlists_to_query = create_followee_playlists_subquery(
                session, current_user_id
            )
        # Otherwise, just query all playlists
        else:
            playlists_to_query = session.query(Playlist).subquery()

        # Create a decayed-score view of the playlists
        playlist_query = (
            session.query(
                playlists_to_query,
                (AggregatePlaylist.repost_count + AggregatePlaylist.save_count).label(
                    "count"
                ),
                decayed_score(
                    AggregatePlaylist.repost_count + AggregatePlaylist.save_count,
                    playlists_to_query.c.created_at,
                ).label("score"),
            )
            .select_from(playlists_to_query)
            .join(
                AggregatePlaylist,
                AggregatePlaylist.playlist_id == playlists_to_query.c.playlist_id,
            )
            .filter(
                playlists_to_query.c.is_current == True,
                playlists_to_query.c.is_delete == False,
                playlists_to_query.c.is_private == False,
                playlists_to_query.c.is_album == (kind == "album"),
            )
        )

        # Filter by mood (no-op if no mood is provided)
        playlist_query = filter_to_playlist_mood(
            session, mood, playlist_query, playlists_to_query
        )

        # Order and limit the playlist query by score
        playlist_query = playlist_query.order_by(
            desc("score"), desc(playlists_to_query.c.created_at)
        ).limit(limit)

        playlist_results = playlist_query.all()

        # Unzip query results into playlists and scores
        score_map = {}  # playlist_id : score
        playlists = []
        if playlist_results:
            for result in playlist_results:
                # The playlist is the portion of the query result before repost_count and score
                playlist = result[0:-2]
                # Convert decimal to float for serialization
                score = float(result[-1])

                # Convert the playlist row tuple into a dictionary keyed by column name
                playlist = helpers.tuple_to_model_dictionary(playlist, Playlist)
                score_map[playlist["playlist_id"]] = score
                playlists.append(playlist)

        playlist_ids = list(map(lambda playlist: playlist["playlist_id"], playlists))

        # Bundle peripheral info into playlist results
        playlists = populate_playlist_metadata(
            session,
            playlist_ids,
            playlists,
            [RepostType.playlist, RepostType.album],
            [SaveType.playlist, SaveType.album],
            current_user_id,
        )
        # Add scores into the response
        for playlist in playlists:
            playlist["score"] = score_map[playlist["playlist_id"]]

        if args.get("with_users", False):
            user_id_list = get_users_ids(playlists)
            users = get_users_by_id(session, user_id_list)
            for playlist in playlists:
                user = users[playlist["playlist_owner_id"]]
                if user:
                    playlist["user"] = user

    return playlists
