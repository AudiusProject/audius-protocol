from sqlalchemy import Column, Index, Integer, Table, Text
from src.models.base import Base

# Materialized view
t_tag_track_user = Table(
    "tag_track_user",
    Base.metadata,
    Column("tag", Text, index=True),
    Column("track_id", Integer),
    Column("owner_id", Integer),
    Index("tag_track_user_idx", "tag", "track_id", "owner_id", unique=True),
)
