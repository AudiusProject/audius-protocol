from sqlalchemy import Column, DateTime, Integer
from src.models.base import Base


class HourlyPlayCounts(Base):
    __tablename__ = "hourly_play_counts"

    hourly_timestamp = Column(DateTime, primary_key=True, nullable=False)
    play_count = Column(Integer, nullable=False, index=False)

    def __repr__(self):
        return f"<HourlyPlayCounts(\
hourly_timestamp={self.hourly_timestamp},\
play_count={self.play_count})>"
