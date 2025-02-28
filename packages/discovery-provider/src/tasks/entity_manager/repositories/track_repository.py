from typing import Dict, List, Optional, cast

from sqlalchemy import and_
from sqlalchemy.orm.session import Session

from src.exceptions import DataAccessError
from src.models.tracks.track import Track

from .base_repository import BaseRepository


class TrackRepository(BaseRepository[Track]):
    """Repository for Track model operations.

    This repository handles all database operations related to the Track model,
    including querying, creating, updating, and deleting tracks.
    """

    def __init__(self, session: Session):
        """Initialize the repository.

        Args:
            session: SQLAlchemy session for database operations
        """
        super().__init__(session, Track)

    def get_tracks_by_user(self, user_id: int) -> List[Track]:
        """Retrieve all tracks owned by a user.

        Args:
            user_id: The ID of the user whose tracks to retrieve

        Returns:
            List of tracks owned by the user
        """
        try:
            return (
                self.session.query(Track)
                .filter(Track.owner_id == user_id)
                .filter(Track.is_current == True)
                .all()
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving tracks for user {user_id}: {str(e)}"
            )

    def get_track_by_id_and_user(self, track_id: int, user_id: int) -> Optional[Track]:
        """Retrieve a specific track owned by a user.

        Args:
            track_id: The ID of the track to retrieve
            user_id: The ID of the user who owns the track

        Returns:
            The track if found, None otherwise
        """
        try:
            return cast(
                Optional[Track],
                self.session.query(Track)
                .filter(
                    and_(
                        Track.track_id == track_id,
                        Track.owner_id == user_id,
                        Track.is_current == True,
                    )
                )
                .first(),
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving track {track_id} for user {user_id}: {str(e)}"
            )

    def get_current_tracks_by_ids(self, track_ids: List[int]) -> Dict[int, Track]:
        """Retrieve current tracks by their IDs.

        Args:
            track_ids: List of track IDs to retrieve

        Returns:
            Dictionary mapping track IDs to Track objects
        """
        try:
            tracks = (
                self.session.query(Track)
                .filter(Track.track_id.in_(track_ids))
                .filter(Track.is_current == True)
                .all()
            )
            return {track.track_id: track for track in tracks}
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving tracks with IDs {track_ids}: {str(e)}"
            )

    def get_tracks_by_user_and_slug(self, user_id: int, slug: str) -> List[Track]:
        """Retrieve tracks by user ID and route slug.

        Args:
            user_id: The ID of the user who owns the track
            slug: The route slug to search for

        Returns:
            List of matching tracks
        """
        try:
            return (
                self.session.query(Track)
                .join(Track._routes)
                .filter(
                    and_(
                        Track.owner_id == user_id,
                        Track._routes.any(slug=slug),
                        Track.is_current == True,
                    )
                )
                .all()
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving tracks for user {user_id} with slug {slug}: {str(e)}"
            )
