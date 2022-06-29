from sqlalchemy import Column, DateTime, Integer
from src.models.base import Base


class RouteMetricsMonthMatview(Base):
    __tablename__ = "route_metrics_month_bucket"

    time = Column(DateTime, nullable=False, primary_key=True)
    unique_count = Column(Integer, nullable=False)
    count = Column(Integer, nullable=False)

    def __repr__(self):
        return f"<RouteMetricsMonthMatview(\
unique_count={self.unique_count},\
count={self.count},\
time={self.time})>"
