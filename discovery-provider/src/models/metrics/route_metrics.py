from sqlalchemy import Column, DateTime, Integer, String, func
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class RouteMetrics(Base, RepresentableMixin):
    __tablename__ = "route_metrics"

    id = Column(Integer, primary_key=True)
    version = Column(String, nullable=True)
    route_path = Column(String, nullable=False)
    query_string = Column(String, nullable=True, default="")
    count = Column(Integer, nullable=False)
    ip = Column(String, nullable=False)
    timestamp = Column(DateTime, nullable=False, default=func.now())
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(
        DateTime, nullable=False, default=func.now(), onupdate=func.now()
    )
