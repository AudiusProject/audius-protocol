from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class Collectibles(Base, RepresentableMixin):
    __tablename__ = "collectibles"

    user_id = Column(
        Integer,
        primary_key=True,
    )
    data = Column(JSONB, nullable=False)
    blockhash = Column(String, nullable=False)
    blocknumber = Column(
        Integer, ForeignKey("blocks.number"), index=True, nullable=False
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
