from sqlalchemy import Column, Date, DateTime, Integer, String, func
from src.models.base import Base


class AggregateMonthlyAppNameMetrics(Base):
    __tablename__ = "aggregate_monthly_app_name_metrics"

    id = Column(Integer, primary_key=True)
    application_name = Column(String, nullable=False)
    count = Column(Integer, nullable=False)
    timestamp = Column(Date, nullable=False)  # first day of month
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(
        DateTime, nullable=False, default=func.now(), onupdate=func.now()
    )

    def __repr__(self):
        return f"<AggregateMonthlyAppNameMetrics(\
application_name={self.application_name},\
count={self.count},\
timestamp={self.timestamp},\
created_at={self.created_at},\
updated_at={self.updated_at}"
