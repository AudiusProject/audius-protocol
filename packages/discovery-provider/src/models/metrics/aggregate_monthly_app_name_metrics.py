from sqlalchemy import Column, Date, DateTime, Integer, String, text

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class AggregateMonthlyAppNameMetric(Base, RepresentableMixin):
    __tablename__ = "aggregate_monthly_app_name_metrics"

    id = Column(
        Integer,
        primary_key=True,
    )
    application_name = Column(String, nullable=False)
    count = Column(Integer, nullable=False)
    timestamp = Column(Date, nullable=False)
    created_at = Column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at = Column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )
