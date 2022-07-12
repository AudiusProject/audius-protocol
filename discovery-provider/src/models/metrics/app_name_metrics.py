from sqlalchemy import Column, DateTime, Integer, String, func
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class AppNameMetrics(Base, RepresentableMixin):
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
