import logging

from src.api.v1.helpers import format_limit, format_offset
from src.models.comments.comment import Comment
from src.models.tracks.track import Track
from src.queries.comments.utils import fetch_related_entities, get_comment_replies
from src.utils.db_session import get_db_read_replica

logger = logging.getLogger(__name__)


def get_replies(args, comment_id, current_user_id=None, include_related=False):
    """
    Get paginated replies to a comment (API endpoint handler)

    Args:
        args: Dictionary containing query parameters
            - offset: Pagination offset
            - limit: Pagination limit
        comment_id: ID of the comment to get replies for
        current_user_id: ID of the user making the request
        include_related: Whether to include related users and tracks in the response

    Returns:
        Dictionary with replies list and related users and tracks
    """
    offset, limit = format_offset(args), format_limit(args)
    db = get_db_read_replica()

    with db.scoped_session() as session:
        # Try to find the artist_id if not provided
        track_query = (
            session.query(Track)
            .join(Comment, Track.track_id == Comment.entity_id)
            .filter(Comment.comment_id == comment_id)
            .first()
        )
        artist_id = track_query.owner_id if track_query else None

        # Use the shared helper function to fetch replies
        formatted_replies = get_comment_replies(
            session=session,
            parent_comment_ids=comment_id,
            current_user_id=current_user_id,
            artist_id=artist_id,
            offset=offset,
            limit=limit,
        )

        # Prepare the response
        if include_related:
            # Fetch related entities
            related_users, related_tracks = fetch_related_entities(
                session, formatted_replies, current_user_id
            )

            # Return the restructured response with related entities
            response = {
                "data": formatted_replies,
                "related": {
                    "users": related_users,
                    "tracks": related_tracks,
                },
            }
        else:
            # Return just the data without related entities
            response = {"data": formatted_replies}

        return response
