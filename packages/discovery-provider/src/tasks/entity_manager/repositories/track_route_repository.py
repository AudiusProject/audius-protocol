from typing import Dict, List, Optional, cast

from sqlalchemy import and_, or_
from sqlalchemy.orm.session import Session

from src.exceptions import DataAccessError
from src.models.tracks.track_route import TrackRoute

from .base_repository import BaseRepository


class TrackRouteRepository(BaseRepository[TrackRoute]):
    """Repository for TrackRoute model operations.

    This repository handles all database operations related to the TrackRoute model,
    including querying and managing track route slugs.
    """

    def __init__(self, session: Session):
        """Initialize the repository.

        Args:
            session: SQLAlchemy session for database operations
        """
        super().__init__(session, TrackRoute)

    def get_route_by_track_id(self, track_id: int) -> Optional[TrackRoute]:
        """Retrieve the current route for a track.

        Args:
            track_id: The ID of the track

        Returns:
            The track route if found, None otherwise
        """
        try:
            return cast(
                Optional[TrackRoute],
                self.session.query(TrackRoute)
                .filter(
                    and_(TrackRoute.track_id == track_id, TrackRoute.is_current == True)
                )
                .first(),
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving route for track {track_id}: {str(e)}"
            )

    def get_routes_by_track_ids(self, track_ids: List[int]) -> Dict[int, TrackRoute]:
        """Retrieve current routes for multiple tracks.

        Args:
            track_ids: List of track IDs to retrieve routes for

        Returns:
            Dictionary mapping track IDs to their current routes
        """
        try:
            routes = (
                self.session.query(TrackRoute)
                .filter(
                    and_(
                        TrackRoute.track_id.in_(track_ids),
                        TrackRoute.is_current == True,
                    )
                )
                .all()
            )
            return {route.track_id: route for route in routes}
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving routes for tracks {track_ids}: {str(e)}"
            )

    def get_route_by_slug(self, slug: str) -> Optional[TrackRoute]:
        """Retrieve a track route by its slug.

        Args:
            slug: The route slug to search for

        Returns:
            The track route if found, None otherwise
        """
        try:
            return cast(
                Optional[TrackRoute],
                self.session.query(TrackRoute)
                .filter(and_(TrackRoute.slug == slug, TrackRoute.is_current == True))
                .first(),
            )
        except Exception as e:
            raise DataAccessError(f"Error retrieving route with slug {slug}: {str(e)}")
