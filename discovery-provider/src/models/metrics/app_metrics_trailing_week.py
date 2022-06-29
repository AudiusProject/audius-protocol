from sqlalchemy import Column, Integer, String
from src.models.base import Base


class AppMetricsTrailingWeek(Base):
    __tablename__ = "app_name_metrics_trailing_week"

    count = Column(Integer, nullable=False)
    name = Column(String, nullable=False, primary_key=True)

    def __repr__(self):
        return f"<AppMetricsTrailingWeek(\
name={self.name},\
count={self.count})>"
