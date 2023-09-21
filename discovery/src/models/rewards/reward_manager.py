from sqlalchemy import Column, DateTime, Integer, String

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class RewardManagerTransaction(Base, RepresentableMixin):
    __tablename__ = "reward_manager_txs"
    signature = Column(String, nullable=False, primary_key=True)
    slot = Column(Integer, nullable=False)
    created_at = Column(DateTime, nullable=False)
