from sqlalchemy import Column, DateTime, Integer, func
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class EthBlock(Base, RepresentableMixin):
    __tablename__ = "eth_blocks"
    last_scanned_block = Column(Integer, primary_key=True, nullable=False)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(
        DateTime, nullable=False, default=func.now(), onupdate=func.now()
    )
