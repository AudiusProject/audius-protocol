from sqlalchemy import BigInteger, Column, DateTime, Table
from src.models.base import Base

# Materialized view
t_route_metrics_day_bucket = Table(
    "route_metrics_day_bucket",
    Base.metadata,
    Column("unique_count", BigInteger),
    Column("count", BigInteger),
    Column("time", DateTime),
)
