from typing import Dict, List, Optional, cast

from sqlalchemy import and_
from sqlalchemy.orm.session import Session

from src.exceptions import DataAccessError
from src.models.playlists.playlist import Playlist

from .base_repository import BaseRepository


class PlaylistRepository(BaseRepository[Playlist]):
    """Repository for Playlist model operations.

    This repository handles all database operations related to the Playlist model,
    including querying, creating, updating, and deleting playlists.
    """

    def __init__(self, session: Session):
        """Initialize the repository.

        Args:
            session: SQLAlchemy session for database operations
        """
        super().__init__(session, Playlist)

    def get_playlists_by_user(self, user_id: int) -> List[Playlist]:
        """Retrieve all playlists owned by a user.

        Args:
            user_id: The ID of the user whose playlists to retrieve

        Returns:
            List of playlists owned by the user
        """
        try:
            return (
                self.session.query(Playlist)
                .filter(Playlist.playlist_owner_id == user_id)
                .filter(Playlist.is_current == True)
                .all()
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving playlists for user {user_id}: {str(e)}"
            )

    def get_playlist_by_id_and_user(
        self, playlist_id: int, user_id: int
    ) -> Optional[Playlist]:
        """Retrieve a specific playlist owned by a user.

        Args:
            playlist_id: The ID of the playlist to retrieve
            user_id: The ID of the user who owns the playlist

        Returns:
            The playlist if found, None otherwise
        """
        try:
            return cast(
                Optional[Playlist],
                self.session.query(Playlist)
                .filter(
                    and_(
                        Playlist.playlist_id == playlist_id,
                        Playlist.playlist_owner_id == user_id,
                        Playlist.is_current == True,
                    )
                )
                .first(),
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving playlist {playlist_id} for user {user_id}: {str(e)}"
            )

    def get_current_playlists_by_ids(
        self, playlist_ids: List[int]
    ) -> Dict[int, Playlist]:
        """Retrieve current playlists by their IDs.

        Args:
            playlist_ids: List of playlist IDs to retrieve

        Returns:
            Dictionary mapping playlist IDs to Playlist objects
        """
        try:
            playlists = (
                self.session.query(Playlist)
                .filter(Playlist.playlist_id.in_(playlist_ids))
                .filter(Playlist.is_current == True)
                .all()
            )
            return {playlist.playlist_id: playlist for playlist in playlists}
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving playlists with IDs {playlist_ids}: {str(e)}"
            )

    def get_playlists_by_user_and_slug(self, user_id: int, slug: str) -> List[Playlist]:
        """Retrieve playlists by user ID and route slug.

        Args:
            user_id: The ID of the user who owns the playlist
            slug: The route slug to search for

        Returns:
            List of matching playlists
        """
        try:
            return (
                self.session.query(Playlist)
                .join(Playlist._routes)
                .filter(
                    and_(
                        Playlist.playlist_owner_id == user_id,
                        Playlist._routes.any(slug=slug),
                        Playlist.is_current == True,
                    )
                )
                .all()
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving playlists for user {user_id} with slug {slug}: {str(e)}"
            )
