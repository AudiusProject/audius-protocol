import logging

from src.api.v1.helpers import format_limit, format_offset
from src.models.tracks.track import Track
from src.queries.comments.utils import (
    COMMENT_ROOT_DEFAULT_LIMIT,
    build_comments_query,
    fetch_related_entities,
    format_comments,
    get_base_comments_query,
)
from src.utils.db_session import get_db_read_replica

logger = logging.getLogger(__name__)


def get_track_comments(args, track_id, current_user_id=None, include_related=False):
    """
    Get comments for a specific track

    Args:
        args: Dictionary containing query parameters
            - sort_method: How to sort the comments (top, newest, timestamp)
            - offset: Pagination offset
            - limit: Pagination limit
        track_id: ID of the track to get comments for
        current_user_id: ID of the user making the request
        include_related: Whether to include related users and tracks in the response

    Returns:
        Dictionary with comments list and related users and tracks
    """
    offset, limit = format_offset(args), format_limit(
        args, default_limit=COMMENT_ROOT_DEFAULT_LIMIT
    )

    db = get_db_read_replica()

    with db.scoped_session() as session:
        # Get the track to find the artist_id and pinned_comment_id
        track = session.query(Track).filter(Track.track_id == track_id).first()
        artist_id = track.owner_id if track else None
        pinned_comment_id = track.pinned_comment_id if track else None

        # Get base query components
        base_query = get_base_comments_query(session, current_user_id)

        # Build the query using the shared utility function
        sort_method = args.get("sort_method", "top")
        query = build_comments_query(
            session=session,
            query_type="track",
            base_query=base_query,
            current_user_id=current_user_id,
            artist_id=artist_id,
            entity_id=track_id,
            pinned_comment_id=pinned_comment_id,
            sort_method=sort_method,
        )

        # Apply pagination
        query = query.offset(offset).limit(limit)

        # Execute the query
        track_comments = query.all()

        # Format comments and collect user/track IDs
        formatted_comments = format_comments(
            session=session,
            comments=track_comments,
            current_user_id=current_user_id,
            include_replies=True,
            artist_id=artist_id,
        )

        # Prepare the response
        if include_related:
            # Fetch related entities
            related_users, related_tracks = fetch_related_entities(
                session, formatted_comments, current_user_id
            )

            # Return the restructured response with related entities
            response = {
                "data": formatted_comments,
                "related": {
                    "users": related_users,
                    "tracks": related_tracks,
                },
            }
        else:
            # Return just the data without related entities
            response = {"data": formatted_comments}

        return response
