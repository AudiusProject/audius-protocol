from sqlalchemy import Column, Index, Integer
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class AggregateTrack(Base, RepresentableMixin):
    __tablename__ = "aggregate_track"

    track_id = Column(Integer, primary_key=True, nullable=False, index=True)
    repost_count = Column(Integer, nullable=False)
    save_count = Column(Integer, nullable=False)

    Index("aggregate_track_idx", "track_id", unique=True)
