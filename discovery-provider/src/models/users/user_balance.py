from sqlalchemy import Column, DateTime, Integer, String, func
from src.models.base import Base


class UserBalance(Base):
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

    def __repr__(self):
        return f"<UserBalance(\
user_id={self.user_id},\
balance={self.balance},\
associated_wallets_balance={self.associated_wallets_balance}\
associated_sol_wallets_balance={self.associated_sol_wallets_balance}\
waudio={self.waudio})>"
