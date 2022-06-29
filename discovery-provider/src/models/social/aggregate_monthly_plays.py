from sqlalchemy import Column, Date, Integer, func
from src.models.base import Base


class AggregateMonthlyPlays(Base):
    # Created for potential use case of year trending
    # No dependencies as of now

    __tablename__ = "aggregate_monthly_plays"

    play_item_id = Column(Integer, primary_key=True, nullable=False)
    timestamp = Column(
        Date, primary_key=True, nullable=False, default=func.now()
    )  # monthly timestamps
    count = Column(Integer, nullable=False)

    def __repr__(self):
        return f"<AggregateMonthlyPlays(\
play_item_id={self.play_item_id},\
timestamp={self.timestamp},\
count={self.count})>"
