from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
)
from .models import Base

class RewardManagerTransaction(Base):
    __tablename__ = "reward_manager_txs"
    signature = Column(String, nullable=False, primary_key=True)
    slot = Column(Integer, nullable=False)
    created_at = Column(DateTime, nullable=False)
    def __repr__(self):
        return f"<RewardManagerTransaction\
signature={self.signature},\
slot={self.slot}\
created_at={self.created_at}\
>"