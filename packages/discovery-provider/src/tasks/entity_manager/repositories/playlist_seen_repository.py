from typing import Dict, List, Optional, cast

from sqlalchemy import and_, or_
from sqlalchemy.orm.session import Session

from src.exceptions import DataAccessError
from src.models.notifications.notification import PlaylistSeen

from .base_repository import BaseRepository


class PlaylistSeenRepository(BaseRepository[PlaylistSeen]):
    """Repository for PlaylistSeen model operations.

    This repository handles all database operations related to the PlaylistSeen model,
    including querying and managing user playlist seen records.
    """

    def __init__(self, session: Session):
        """Initialize the repository.

        Args:
            session: SQLAlchemy session for database operations
        """
        super().__init__(session, PlaylistSeen)

    def get_seen_by_playlist_id(self, playlist_id: int) -> Optional[PlaylistSeen]:
        """Retrieve the current seen record for a playlist.

        Args:
            playlist_id: The ID of the playlist

        Returns:
            The playlist seen record if found, None otherwise
        """
        try:
            return cast(
                Optional[PlaylistSeen],
                self.session.query(PlaylistSeen)
                .filter(
                    and_(
                        PlaylistSeen.playlist_id == playlist_id,
                        PlaylistSeen.is_current == True,
                    )
                )
                .first(),
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving seen record for playlist {playlist_id}: {str(e)}"
            )

    def get_seen_by_playlist_ids(
        self, playlist_ids: List[int]
    ) -> Dict[int, PlaylistSeen]:
        """Retrieve current seen records for multiple playlists.

        Args:
            playlist_ids: List of playlist IDs to retrieve seen records for

        Returns:
            Dictionary mapping playlist IDs to their current seen records
        """
        try:
            seen_records = (
                self.session.query(PlaylistSeen)
                .filter(
                    and_(
                        PlaylistSeen.playlist_id.in_(playlist_ids),
                        PlaylistSeen.is_current == True,
                    )
                )
                .all()
            )
            return {record.playlist_id: record for record in seen_records}
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving seen records for playlists {playlist_ids}: {str(e)}"
            )
