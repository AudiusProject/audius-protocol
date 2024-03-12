from sqlalchemy import Column, Date, Integer, String, text

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


# Created for potential use case of year trending
# No dependencies as of now
class AggregateMonthlyPlay(Base, RepresentableMixin):
    __tablename__ = "aggregate_monthly_plays"

    play_item_id = Column(Integer, primary_key=True, nullable=False)
    timestamp = Column(
        Date, primary_key=True, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )
    country = Column(String, primary_key=True, nullable=False, server_default="")
    count = Column(Integer, nullable=False)
