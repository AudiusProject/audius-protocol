from sqlalchemy import Column, Date, Integer, func
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class AggregateMonthlyPlays(Base, RepresentableMixin):
    # Created for potential use case of year trending
    # No dependencies as of now

    __tablename__ = "aggregate_monthly_plays"

    play_item_id = Column(Integer, primary_key=True, nullable=False)
    timestamp = Column(
        Date, primary_key=True, nullable=False, default=func.now()
    )  # monthly timestamps
    count = Column(Integer, nullable=False)
