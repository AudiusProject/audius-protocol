from sqlalchemy import Column, DateTime, Integer, String, func
from src.models.base import Base


class AppNameMetrics(Base):
    __tablename__ = "app_name_metrics"

    id = Column(Integer, primary_key=True)
    application_name = Column(String, nullable=False)
    count = Column(Integer, nullable=False)
    ip = Column(String, nullable=True)
    timestamp = Column(DateTime, nullable=False, default=func.now())
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(
        DateTime, nullable=False, default=func.now(), onupdate=func.now()
    )

    def __repr__(self):
        return f"<AppNameMetrics(\
application_name={self.application_name},\
count={self.count},\
ip={self.ip},\
timestamp={self.timestamp},\
created_at={self.created_at},\
updated_at={self.updated_at}"
