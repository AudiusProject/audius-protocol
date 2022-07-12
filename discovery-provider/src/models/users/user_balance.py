from sqlalchemy import Column, DateTime, Integer, String, func
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class UserBalance(Base, RepresentableMixin):
    __tablename__ = "user_balances"

    user_id = Column(Integer, nullable=False, primary_key=True)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(
        DateTime, nullable=False, default=func.now(), onupdate=func.now()
    )

    # balance in Wei
    balance = Column(String, nullable=False)
    associated_wallets_balance = Column(String, nullable=False)
    associated_sol_wallets_balance = Column(String, nullable=False)

    # wAudio balance
    waudio = Column(String, nullable=False)
