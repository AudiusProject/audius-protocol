import logging  # pylint: disable=C0302
from typing import Any, Optional, TypedDict

from sqlalchemy.orm.session import Session

from src.api.v1.helpers import extend_track, format_limit, format_offset
from src.gated_content.constants import (
    SHOULD_TRENDING_EXCLUDE_COLLECTIBLE_GATED_TRACKS,
    SHOULD_TRENDING_EXCLUDE_GATED_TRACKS,
)
from src.queries.generate_unpopulated_trending_tracks import TRENDING_TRACKS_LIMIT
from src.queries.get_unpopulated_tracks import get_unpopulated_tracks
from src.queries.query_helpers import (
    get_users_by_id,
    get_users_ids,
    populate_track_metadata,
)
from src.utils.db_session import get_db_read_replica
from src.utils.helpers import decode_string_id

logger = logging.getLogger(__name__)

UNDERGROUND_TRENDING_LENGTH = 50


def make_get_unpopulated_tracks(session, strategy):
    # TODO: Update to pull from scores table

    # If SHOULD_TRENDING_EXCLUDE_GATED_TRACKS is true, then filter out track ids
    # belonging to gated tracks before applying the limit.
    if SHOULD_TRENDING_EXCLUDE_GATED_TRACKS:
        track_scoring_data = list(
            filter(lambda item: not item["is_stream_gated"], track_scoring_data)
        )
    # If SHOULD_TRENDING_EXCLUDE_COLLECTIBLE_GATED_TRACKS is true, then filter out track ids
    # belonging to collectible gated tracks before applying the limit.
    elif SHOULD_TRENDING_EXCLUDE_COLLECTIBLE_GATED_TRACKS:
        track_scoring_data = list(
            filter(
                lambda item: (item["stream_conditions"] is None)
                or ("nft_collection" not in item["stream_conditions"]),
                track_scoring_data,
            )
        )

    scored_tracks = [
        strategy.get_track_score("week", track) for track in track_scoring_data
    ]
    sorted_tracks = sorted(scored_tracks, key=lambda k: k["score"], reverse=True)
    sorted_tracks = sorted_tracks[:UNDERGROUND_TRENDING_LENGTH]

    # Get unpopulated metadata
    track_ids = [track["track_id"] for track in sorted_tracks]
    tracks = get_unpopulated_tracks(
        session,
        track_ids,
        exclude_gated=SHOULD_TRENDING_EXCLUDE_GATED_TRACKS,
    )

    return (tracks, track_ids)


class GetUndergroundTrendingTrackArgs(TypedDict, total=False):
    current_user_id: Optional[Any]
    offset: int
    limit: int


def _get_underground_trending_with_session(
    session: Session,
    args: GetUndergroundTrendingTrackArgs,
    strategy,
    use_request_context=True,
):
    current_user_id = args.get("current_user_id", None)
    limit, offset = args.get("limit"), args.get("offset")

    (tracks, track_ids) = make_get_unpopulated_tracks(session, strategy)

    # Apply limit + offset early to reduce the amount of
    # population work we have to do
    if limit is not None and offset is not None:
        track_ids = track_ids[offset : limit + offset]

    tracks = populate_track_metadata(session, track_ids, tracks, current_user_id)

    tracks_map = {track["track_id"]: track for track in tracks}

    # Re-sort the populated tracks b/c it loses sort order in sql query
    sorted_tracks = [tracks_map[track_id] for track_id in track_ids]
    user_id_list = get_users_ids(sorted_tracks)
    users = get_users_by_id(session, user_id_list, current_user_id, use_request_context)
    for track in sorted_tracks:
        user = users[track["owner_id"]]
        if user:
            track["user"] = user
    sorted_tracks = [extend_track(track, session) for track in sorted_tracks]

    return sorted_tracks


def _get_underground_trending(args: GetUndergroundTrendingTrackArgs, strategy):
    db = get_db_read_replica()
    with db.scoped_session() as session:
        return _get_underground_trending_with_session(session, args, strategy)


def get_underground_trending(request, args, strategy):
    offset, limit = format_offset(args), format_limit(args, TRENDING_TRACKS_LIMIT)
    current_user_id = args.get("user_id")
    args = {"limit": limit, "offset": offset}

    # If user ID, let _get_underground_trending
    # handle caching + limit + offset
    if current_user_id:
        decoded = decode_string_id(current_user_id)
        args["current_user_id"] = decoded
    trending = _get_underground_trending(args, strategy)
    return trending
