from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text

from src.models.base import Base


class Comment(Base):
    __tablename__ = "comments"

    comment_id = Column(Integer, primary_key=True)
    text = Column(Text, nullable=False)
    user_id = Column(Integer, nullable=False)
    entity_id = Column(Integer, nullable=False)
    entity_type = Column(String(255), nullable=False)
    track_timestamp_ms = Column(Integer, nullable=False)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)
    is_delete = Column(Boolean, default=False)
    is_visible = Column(Boolean, default=True)
    is_pinned = Column(Boolean, default=False)
    is_edited = Column(Boolean, default=False)
    txhash = Column(Text, nullable=False)
    blockhash = Column(Text, nullable=False)
    blocknumber = Column(Integer, nullable=False)
