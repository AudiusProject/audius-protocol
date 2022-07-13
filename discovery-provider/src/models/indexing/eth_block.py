from sqlalchemy import Column, DateTime, Integer, text
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class EthBlock(Base, RepresentableMixin):
    __tablename__ = "eth_blocks"

    last_scanned_block = Column(Integer, primary_key=True)
    created_at = Column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at = Column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )
