from sqlalchemy import Column, Date, DateTime, Integer, text

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class AggregateDailyTotalUsersMetrics(Base, RepresentableMixin):
    __tablename__ = "aggregate_daily_total_users_metrics"

    id = Column(
        Integer,
        primary_key=True,
    )
    count = Column(Integer, nullable=False)
    timestamp = Column(Date, nullable=False)
    created_at = Column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at = Column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )
    personal_count = Column(Integer)
