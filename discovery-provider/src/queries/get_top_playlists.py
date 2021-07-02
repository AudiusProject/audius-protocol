from sqlalchemy import desc

from src import exceptions
from src.models import RepostType, Playlist, SaveType
from src.utils import helpers
from src.utils.db_session import get_db_read_replica
from src.queries.query_helpers import (
    get_current_user_id,
    populate_playlist_metadata,
    get_users_by_id,
    get_users_ids,
    create_save_repost_count_subquery,
    decayed_score,
    filter_to_playlist_mood,
    create_followee_playlists_subquery,
)


def get_top_playlists(kind, args):
    current_user_id = get_current_user_id(required=False)

    # Argument parsing and checking
    if kind not in ("playlist", "album"):
        raise exceptions.ArgumentError(
            "Invalid kind provided, must be one of 'playlist', 'album'"
        )

    limit = args.get("limit", 16)
    mood = args.get("mood", None)

    if "filter" in args:
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
        # Construct a subquery to get the summed save + repost count for the `kind`
        count_subquery = create_save_repost_count_subquery(session, kind)

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
                count_subquery.c["count"],
                decayed_score(
                    count_subquery.c["count"], playlists_to_query.c.created_at
                ).label("score"),
            )
            .select_from(playlists_to_query)
            .join(
                count_subquery,
                count_subquery.c["id"] == playlists_to_query.c.playlist_id,
            )
            .filter(
                playlists_to_query.c.is_current == True,
                playlists_to_query.c.is_delete == False,
                playlists_to_query.c.is_private == False,
            )
        )

        # Filter by mood (no-op if no mood is provided)
        playlist_query = filter_to_playlist_mood(
            session, mood, playlist_query, playlists_to_query
        )

        # Order and limit the playlist query by score
        playlist_query = playlist_query.order_by(
            desc("score"), desc(playlists_to_query.c.playlist_id)
        ).limit(limit)

        playlist_results = playlist_query.all()

        # Unzip query results into playlists and scores
        score_map = {}  # playlist_id : score
        playlists = []
        if playlist_results:
            for result in playlist_results:
                # The playlist is the portion of the query result before repost_count and score
                playlist = result[0:-2]
                score = result[-1]

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
