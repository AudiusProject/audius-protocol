from sqlalchemy import Column, Integer, String
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class TrendingParam(Base, RepresentableMixin):
    """
    Trending Params aggregate the paramters used to calculate trending track scores
    """

    __tablename__ = "trending_params"

    track_id = Column(Integer, nullable=False, index=True, primary_key=True)
    genre = Column(String, nullable=True)
    owner_id = Column(Integer, nullable=False)
    play_count = Column(Integer, nullable=False)
    owner_follower_count = Column(Integer, nullable=False)
    repost_count = Column(Integer, nullable=False)
    repost_week_count = Column(Integer, nullable=False)
    repost_month_count = Column(Integer, nullable=False)
    repost_year_count = Column(Integer, nullable=False)
    save_count = Column(Integer, nullable=False)
    save_week_count = Column(Integer, nullable=False)
    save_month_count = Column(Integer, nullable=False)
    save_year_count = Column(Integer, nullable=False)
    karma = Column(Integer, nullable=False)
