from sqlalchemy import Column, DateTime, Integer, func
from src.models.base import Base


class EthBlock(Base):
    __tablename__ = "eth_blocks"
    last_scanned_block = Column(Integer, primary_key=True, nullable=False)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(
        DateTime, nullable=False, default=func.now(), onupdate=func.now()
    )

    def __repr__(self):
        return f"<EthBlock(\
last_scanned_block={self.last_scanned_block},\
created_at={self.created_at},\
updated_at={self.updated_at})>"
