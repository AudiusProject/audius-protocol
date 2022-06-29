from sqlalchemy import Column, Integer, String
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class AppMetricsTrailingWeek(Base, RepresentableMixin):
    __tablename__ = "app_name_metrics_trailing_week"

    count = Column(Integer, nullable=False)
    name = Column(String, nullable=False, primary_key=True)
