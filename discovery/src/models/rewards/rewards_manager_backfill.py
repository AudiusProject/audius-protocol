from sqlalchemy import Column, DateTime, Integer, String

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class RewardsManagerBackfillTransaction(Base, RepresentableMixin):
    __tablename__ = "rewards_manager_backfill_txs"
    signature = Column(String, nullable=False, primary_key=True)
    slot = Column(Integer, nullable=False)
    created_at = Column(DateTime, nullable=False)
