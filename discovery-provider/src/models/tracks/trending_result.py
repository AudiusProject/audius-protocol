from sqlalchemy import Column, Date, Integer, PrimaryKeyConstraint, String
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class TrendingResult(Base, RepresentableMixin):
    """
    Trending Results track the top trending tracks/playlists each week to keep a record of the winners
    for reference in the trending challenges
    """

    __tablename__ = "trending_results"
    user_id = Column(Integer, nullable=False, index=True)
    id = Column(Integer, nullable=False)
    rank = Column(Integer, nullable=False)
    type = Column(String, nullable=False)
    version = Column(String, nullable=False)
    week = Column(Date, nullable=False)
    PrimaryKeyConstraint(rank, type, version, week)
