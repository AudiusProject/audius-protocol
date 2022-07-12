from sqlalchemy import Column, DateTime, Index, Integer, String, func
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class Play(Base, RepresentableMixin):
    __tablename__ = "plays"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=True, index=False)
    source = Column(String, nullable=True, index=False)
    city = Column(String, nullable=True, index=False)
    region = Column(String, nullable=True, index=False)
    country = Column(String, nullable=True, index=False)
    play_item_id = Column(Integer, nullable=False, index=False)
    slot = Column(Integer, nullable=True, index=True)
    signature = Column(String, nullable=True, index=False)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(
        DateTime, nullable=False, default=func.now(), onupdate=func.now()
    )

    Index("ix_plays_user_play_item", "play_item_id", "user_id", unique=False)
    Index(
        "ix_plays_user_play_item_date",
        "play_item_id",
        "user_id",
        "created_at",
        unique=False,
    )
    Index("ix_plays_sol_signature", "play_item_id", "signature", unique=False)
