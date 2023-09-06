from sqlalchemy import Column, DateTime, Index, Integer, String, text

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class Play(Base, RepresentableMixin):
    __tablename__ = "plays"
    __table_args__ = (
        Index("ix_plays_user_play_item_date", "play_item_id", "user_id", "created_at"),
        Index("ix_plays_user_play_item", "play_item_id", "user_id"),
    )

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer)
    source = Column(String)
    play_item_id = Column(Integer, nullable=False, index=True)
    created_at = Column(
        DateTime, nullable=False, index=True, server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at = Column(
        DateTime, nullable=False, index=True, server_default=text("CURRENT_TIMESTAMP")
    )
    slot = Column(Integer, index=True)
    signature = Column(String, index=True)
    city = Column(String)
    region = Column(String)
    country = Column(String)
