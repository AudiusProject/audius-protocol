from sqlalchemy import Column, DateTime, Integer, String, func
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class SPLTokenBackfillTransaction(Base, RepresentableMixin):
    __tablename__ = "spl_token_backfill_txs_v2"
    slot = Column(Integer, nullable=False)
    signature = Column(String, primary_key=True, nullable=False)
    created_at = Column(DateTime, nullable=False, default=func.now())
