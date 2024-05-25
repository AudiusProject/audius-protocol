from sqlalchemy import BigInteger, Column, DateTime, Integer, String, text
from typing_extensions import Self

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class UserPayoutWalletHistory(Base, RepresentableMixin):
    __tablename__ = "user_payout_wallet_history"

    user_id = Column(Integer, nullable=False, primary_key=True)
    spl_usdc_payout_wallet = Column(String, nullable=True)
    blocknumber = Column(BigInteger, nullable=False)
    block_timestamp = Column(DateTime, nullable=False, primary_key=True)
    created_at = Column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )

    def equals(self, rec: Self):
        return self.spl_usdc_payout_wallet == rec.spl_usdc_payout_wallet
