from sqlalchemy import BigInteger, Column, Table
from src.models.base import Base

t_route_metrics_trailing_week = Table(
    "route_metrics_trailing_week",
    Base.metadata,
    Column("unique_count", BigInteger),
    Column("count", BigInteger),
)
