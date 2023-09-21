from sqlalchemy import Column, DateTime, Integer

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class HourlyPlayCount(Base, RepresentableMixin):
    __tablename__ = "hourly_play_counts"

    hourly_timestamp = Column(DateTime, primary_key=True)
    play_count = Column(Integer, nullable=False)
