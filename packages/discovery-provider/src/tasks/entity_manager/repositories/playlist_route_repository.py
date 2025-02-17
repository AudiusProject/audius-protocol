from typing import Dict, List, Optional, cast

from sqlalchemy import and_, or_
from sqlalchemy.orm.session import Session

from src.exceptions import DataAccessError
from src.models.playlists.playlist_route import PlaylistRoute

from .base_repository import BaseRepository


class PlaylistRouteRepository(BaseRepository[PlaylistRoute]):
    """Repository for PlaylistRoute model operations.

    This repository handles all database operations related to the PlaylistRoute model,
    including querying and managing playlist route slugs.
    """

    def __init__(self, session: Session):
        """Initialize the repository.

        Args:
            session: SQLAlchemy session for database operations
        """
        super().__init__(session, PlaylistRoute)

    def get_route_by_playlist_id(self, playlist_id: int) -> Optional[PlaylistRoute]:
        """Retrieve the current route for a playlist.

        Args:
            playlist_id: The ID of the playlist

        Returns:
            The playlist route if found, None otherwise
        """
        try:
            return cast(
                Optional[PlaylistRoute],
                self.session.query(PlaylistRoute)
                .filter(
                    and_(
                        PlaylistRoute.playlist_id == playlist_id,
                        PlaylistRoute.is_current == True,
                    )
                )
                .first(),
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving route for playlist {playlist_id}: {str(e)}"
            )

    def get_routes_by_playlist_ids(
        self, playlist_ids: List[int]
    ) -> Dict[int, PlaylistRoute]:
        """Retrieve current routes for multiple playlists.

        Args:
            playlist_ids: List of playlist IDs to retrieve routes for

        Returns:
            Dictionary mapping playlist IDs to their current routes
        """
        try:
            routes = (
                self.session.query(PlaylistRoute)
                .filter(
                    and_(
                        PlaylistRoute.playlist_id.in_(playlist_ids),
                        PlaylistRoute.is_current == True,
                    )
                )
                .all()
            )
            return {route.playlist_id: route for route in routes}
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving routes for playlists {playlist_ids}: {str(e)}"
            )

    def get_route_by_slug(self, slug: str) -> Optional[PlaylistRoute]:
        """Retrieve a playlist route by its slug.

        Args:
            slug: The route slug to search for

        Returns:
            The playlist route if found, None otherwise
        """
        try:
            return cast(
                Optional[PlaylistRoute],
                self.session.query(PlaylistRoute)
                .filter(
                    and_(PlaylistRoute.slug == slug, PlaylistRoute.is_current == True)
                )
                .first(),
            )
        except Exception as e:
            raise DataAccessError(f"Error retrieving route with slug {slug}: {str(e)}")
