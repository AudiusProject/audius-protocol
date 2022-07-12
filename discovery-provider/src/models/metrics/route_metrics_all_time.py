from sqlalchemy import Column, Integer, PrimaryKeyConstraint
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class RouteMetricsAllTime(Base, RepresentableMixin):
    __tablename__ = "route_metrics_all_time"

    unique_count = Column(Integer, nullable=False)
    count = Column(Integer, nullable=False)
    PrimaryKeyConstraint(unique_count, count)
