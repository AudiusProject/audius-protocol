from sqlalchemy import Column, DateTime, Integer, String
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class UserBankTransaction(Base, RepresentableMixin):
    __tablename__ = "user_bank_txs"
    signature = Column(String, nullable=False, primary_key=True)
    slot = Column(Integer, nullable=False)
    created_at = Column(DateTime, nullable=False)


class UserBankAccount(Base, RepresentableMixin):
    __tablename__ = "user_bank_accounts"
    signature = Column(String, nullable=False, primary_key=True)
    ethereum_address = Column(String, nullable=False, index=True)
    bank_account = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False)
