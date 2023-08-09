from sqlalchemy import BigInteger, Column, DateTime, Integer, String, Table

from src.models.base import Base

# Materialized view
t_aggregate_interval_plays = Table(
    "aggregate_interval_plays",
    Base.metadata,
    Column("track_id", Integer, index=True),
    Column("genre", String),
    Column("created_at", DateTime),
    Column("week_listen_counts", BigInteger, index=True),
    Column("month_listen_counts", BigInteger, index=True),
)
