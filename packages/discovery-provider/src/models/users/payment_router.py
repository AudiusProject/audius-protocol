from sqlalchemy import Column, DateTime, Integer, String

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class PaymentRouterTx(Base, RepresentableMixin):
    __tablename__ = "payment_router_txs"

    signature = Column(String, primary_key=True)
    slot = Column(Integer, nullable=False, index=True)
    created_at = Column(DateTime, nullable=False)
