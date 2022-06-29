from sqlalchemy import Column, Date, DateTime, Integer, func
from src.models.base import Base


class AggregateMonthlyUniqueUsersMetrics(Base):
    __tablename__ = "aggregate_monthly_unique_users_metrics"

    id = Column(Integer, primary_key=True)
    count = Column(Integer, nullable=False)
    summed_count = Column(Integer, nullable=True)
    timestamp = Column(Date, nullable=False)  # first day of month
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(
        DateTime, nullable=False, default=func.now(), onupdate=func.now()
    )

    def __repr__(self):
        return f"<AggregateMonthlyUniqueUsersMetrics(\
count={self.count},\
timestamp={self.timestamp},\
created_at={self.created_at},\
updated_at={self.updated_at}"
