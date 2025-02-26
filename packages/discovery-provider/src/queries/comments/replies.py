import logging

from src.api.v1.helpers import format_limit, format_offset
from src.models.comments.comment import Comment
from src.models.tracks.track import Track
from src.queries.comments.utils import (
    COMMENT_REPLIES_DEFAULT_LIMIT,
    _format_comment_response,
    build_comments_query,
    fetch_related_entities,
    format_comments,
    get_base_comments_query,
)
from src.utils.db_session import get_db_read_replica

logger = logging.getLogger(__name__)


def get_replies(
    session,
    parent_comment_id,
    current_user_id,
    # note: artist id already exists when used via get_track_comments - no need to requery for it
    artist_id=None,
    offset=0,
    limit=COMMENT_REPLIES_DEFAULT_LIMIT,
):
    """
    Get replies to a specific comment

    Args:
        session: Database session
        parent_comment_id: ID of the parent comment to get replies for
        current_user_id: ID of the user making the request
        artist_id: ID of the track owner (optional)
        offset: Pagination offset
        limit: Pagination limit

    Returns:
        List of reply objects with metadata
    """
    if artist_id is None:
        # Try to find the artist_id if not provided
        track_query = (
            session.query(Track)
            .join(Comment, Track.track_id == Comment.entity_id)
            .filter(Comment.comment_id == parent_comment_id)
            .first()
        )
        artist_id = track_query.owner_id if track_query else None

    # Get base query components
    base_query = get_base_comments_query(session, current_user_id)

    # Build the query using the shared utility function
    query = build_comments_query(
        session=session,
        query_type="replies",
        base_query=base_query,
        current_user_id=current_user_id,
        artist_id=artist_id,
        parent_comment_id=parent_comment_id,
    )

    # Apply pagination if provided
    if offset is not None:
        query = query.offset(offset)
    if limit is not None:
        query = query.limit(limit)

    # Execute the query
    replies = query.all()

    # Format the results
    return [
        _format_comment_response(
            reply,
            react_count,
            None,  # is_muted is None for replies
            mentions,
            current_user_id,
            session,
            artist_id=artist_id,
        )
        for reply, react_count, mentions in replies
    ]


def get_paginated_replies(args, comment_id, current_user_id=None, include_related=True):
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
        # Get base query components
        base_query = get_base_comments_query(session, current_user_id)

        # Try to find the artist_id if not provided
        track_query = (
            session.query(Track)
            .join(Comment, Track.track_id == Comment.entity_id)
            .filter(Comment.comment_id == comment_id)
            .first()
        )
        artist_id = track_query.owner_id if track_query else None

        # Build the query using the shared utility function
        query = build_comments_query(
            session=session,
            query_type="replies",
            base_query=base_query,
            current_user_id=current_user_id,
            artist_id=artist_id,
            parent_comment_id=comment_id,
        )

        # Apply pagination
        query = query.offset(offset).limit(limit)

        # Execute the query
        replies_query_results = query.all()

        # Format comments and collect user/track IDs
        formatted_replies, user_ids, track_ids = format_comments(
            session=session,
            comments=replies_query_results,
            current_user_id=current_user_id,
            include_replies=False,
            artist_id=artist_id,
        )

        # Prepare the response
        if include_related:
            # Fetch related entities
            related_users, related_tracks = fetch_related_entities(
                session, user_ids, track_ids, current_user_id
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
