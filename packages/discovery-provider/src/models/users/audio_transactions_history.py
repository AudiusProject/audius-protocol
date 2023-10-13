import enum

from sqlalchemy import Column, DateTime, Enum, Integer, Numeric, String, text

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class TransactionType(str, enum.Enum):
    tip = "TIP"
    user_reward = "USER_REWARD"
    trending_reward = "TRENDING_REWARD"
    transfer = "TRANSFER"
    purchase_stripe = "PURCHASE_STRIPE"
    purchase_coinbase = "PURCHASE_COINBASE"
    purchase_unknown = "PURCHASE UNKNOWN"


class TransactionMethod(str, enum.Enum):
    send = "SEND"
    receive = "RECEIVE"


class AudioTransactionsHistory(Base, RepresentableMixin):
    __tablename__ = "audio_transactions_history"

    user_bank = Column(String, primary_key=True, nullable=False)
    slot = Column(Integer, nullable=False, index=True)
    signature = Column(String, primary_key=True, nullable=False)
    transaction_type = Column(Enum(TransactionType), nullable=False, index=True)
    method = Column(Enum(TransactionMethod), nullable=False, index=True)
    created_at = Column(
        DateTime, nullable=False, index=True, server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at = Column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )
    transaction_created_at = Column(DateTime, nullable=False)
    change = Column(Numeric, nullable=False)
    balance = Column(Numeric, nullable=False)
    tx_metadata = Column(String, nullable=True)
