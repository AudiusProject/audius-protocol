from sqlalchemy import BigInteger, Column, Integer, Numeric, String, Table

from src.models.base import Base

"""
Trending Params aggregate the paramters used to calculate trending track scores
"""

# Materialized view
t_trending_params = Table(
    "trending_params",
    Base.metadata,
    Column("track_id", Integer, index=True),
    Column("genre", String),
    Column("owner_id", Integer),
    Column("play_count", BigInteger),
    Column("owner_follower_count", BigInteger),
    Column("repost_count", Integer),
    Column("save_count", Integer),
    Column("repost_week_count", BigInteger),
    Column("repost_month_count", BigInteger),
    Column("repost_year_count", BigInteger),
    Column("save_week_count", BigInteger),
    Column("save_month_count", BigInteger),
    Column("save_year_count", BigInteger),
    Column("karma", Numeric),
)
