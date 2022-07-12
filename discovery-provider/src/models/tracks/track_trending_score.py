from sqlalchemy import Column, DateTime, Float, Integer, PrimaryKeyConstraint, String
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class TrackTrendingScore(Base, RepresentableMixin):
    """
    Trending Scores for tracks
    """

    __tablename__ = "track_trending_scores"

    track_id = Column(Integer, nullable=False, index=True)
    genre = Column(String, nullable=True)
    type = Column(String, nullable=False)
    version = Column(String, nullable=False)
    time_range = Column(String, nullable=False)
    score = Column(Float, nullable=False, index=True)
    created_at = Column(DateTime, nullable=False)

    PrimaryKeyConstraint(track_id, genre, version, time_range)
