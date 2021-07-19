from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
)
from .models import Base

class UserBankTransaction(Base):
    __tablename__ = "user_bank_txs"
    signature = Column(String, nullable=False, primary_key=True)
    slot = Column(Integer, nullable=False)
    created_at = Column(DateTime, nullable=False)
    def __repr__(self):
        return f"<UserBankTransaction\
signature={self.signature},\
slot={self.slot}\
created_at={self.created_at}\
>"

class UserBankAccount(Base):
    __tablename__ = "user_bank_accounts"
    signature = Column(String, nullable=False, primary_key=True)
    ethereum_address = Column(String, nullable=False)
    bank_account = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False)
    def __repr__(self):
        return f"<UserBankTransaction\
signature={self.signature},\
ethereum_address={self.ethereum_address}\
created_at={self.created_at}\
>"