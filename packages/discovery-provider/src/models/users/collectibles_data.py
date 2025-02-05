import enum

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class CollectiblesData(Base, RepresentableMixin):
    __tablename__ = "collectibles_data"

    user_id = Column(
        Integer,
        primary_key=True,
    )
    data = Column(JSONB, nullable=False)
    blockhash = Column(String, nullable=False)
    blocknumber = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
