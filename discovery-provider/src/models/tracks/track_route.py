from sqlalchemy import Boolean, Column, Index, Integer, String

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class TrackRoute(Base, RepresentableMixin):
    __tablename__ = "track_routes"
    __table_args__ = (Index("track_routes_track_id_idx", "track_id", "is_current"),)

    # Actual URL slug for the track, includes collision_id
    slug = Column(String, primary_key=True, nullable=False)
    # Just the title piece of the slug for the track, excludes collision_id
    # Used for finding max collision_id needed for duplicate title_slugs
    title_slug = Column(String, nullable=False)
    collision_id = Column(Integer, nullable=False)
    owner_id = Column(Integer, primary_key=True, nullable=False)
    track_id = Column(Integer, nullable=False)
    is_current = Column(Boolean, nullable=False)
    blockhash = Column(String, nullable=False)
    blocknumber = Column(Integer, nullable=False)
    txhash = Column(String, nullable=False)
