from sqlalchemy import Column, Date, Integer, String
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class TrendingResult(Base, RepresentableMixin):
    """
    Trending Results track the top trending tracks/playlists each week to keep a record of the winners
    for reference in the trending challenges
    """

    __tablename__ = "trending_results"

    user_id = Column(Integer, nullable=False)
    id = Column(String)
    rank = Column(Integer, primary_key=True, nullable=False)
    type = Column(String, primary_key=True, nullable=False)
    version = Column(String, primary_key=True, nullable=False)
    week = Column(Date, primary_key=True, nullable=False)
