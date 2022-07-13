from sqlalchemy import BigInteger, Column, Table
from src.models.base import Base

# Materialized view
t_route_metrics_trailing_month = Table(
    "route_metrics_trailing_month",
    Base.metadata,
    Column("unique_count", BigInteger),
    Column("count", BigInteger),
)
