from sqlalchemy import Column, Integer
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class AggregateIntervalPlay(Base, RepresentableMixin):
    """
    Aggregate Interval Play aggregates the plays by time interval
    """

    __tablename__ = "aggregate_interval_plays"

    track_id = Column(Integer, nullable=False, primary_key=True)
    genre = Column(Integer, nullable=False)
    created_at = Column(Integer, nullable=False)
    week_listen_counts = Column(Integer, nullable=False, index=True)
    month_listen_counts = Column(Integer, nullable=False, index=True)
