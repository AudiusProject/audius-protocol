from sqlalchemy import Column, Integer, PrimaryKeyConstraint
from src.models.base import Base


class RouteMetricsTrailingMonth(Base):
    __tablename__ = "route_metrics_trailing_month"

    unique_count = Column(Integer, nullable=False)
    count = Column(Integer, nullable=False)
    PrimaryKeyConstraint(unique_count, count)

    def __repr__(self):
        return f"<RouteMetricsTrailingMonth(\
unique_count={self.unique_count},\
count={self.count})>"
