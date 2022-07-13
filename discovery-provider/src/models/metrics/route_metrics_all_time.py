from sqlalchemy import BigInteger, Column, Table
from src.models.base import Base

# Materialized view
t_route_metrics_all_time = Table(
    "route_metrics_all_time",
    Base.metadata,
    Column("unique_count", BigInteger),
    Column("count", BigInteger),
)
