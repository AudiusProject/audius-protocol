from sqlalchemy import Column, Integer, String
from src.models.base import Base


class AppMetricsAllTime(Base):
    __tablename__ = "app_name_metrics_all_time"

    count = Column(Integer, nullable=False)
    name = Column(String, nullable=False, primary_key=True)

    def __repr__(self):
        return f"<AppMetricsAllTime(\
name={self.name},\
count={self.count})>"
