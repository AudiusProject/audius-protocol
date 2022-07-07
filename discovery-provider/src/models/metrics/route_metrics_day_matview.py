from sqlalchemy import Column, DateTime, Integer
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class RouteMetricsDayMatview(Base, RepresentableMixin):
    __tablename__ = "route_metrics_day_bucket"

    time = Column(DateTime, nullable=False, primary_key=True)
    unique_count = Column(Integer, nullable=False)
    count = Column(Integer, nullable=False)
