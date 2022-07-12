from sqlalchemy import Column, Date, DateTime, Integer, String, func
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class AggregateDailyAppNameMetrics(Base, RepresentableMixin):
    __tablename__ = "aggregate_daily_app_name_metrics"

    id = Column(Integer, primary_key=True)
    application_name = Column(String, nullable=False)
    count = Column(Integer, nullable=False)
    timestamp = Column(Date, nullable=False)  # zeroed out to the day
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(
        DateTime, nullable=False, default=func.now(), onupdate=func.now()
    )
