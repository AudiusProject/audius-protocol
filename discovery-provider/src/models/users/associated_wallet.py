import enum

from sqlalchemy import Boolean, Column, Enum, ForeignKey, Integer, String
from src.models.base import Base


class WalletChain(str, enum.Enum):
    eth = "eth"
    sol = "sol"


class AssociatedWallet(Base):
    __tablename__ = "associated_wallets"
    blockhash = Column(String, ForeignKey("blocks.blockhash"), nullable=False)
    blocknumber = Column(Integer, ForeignKey("blocks.number"), nullable=False)
    is_current = Column(Boolean, nullable=False)
    is_delete = Column(Boolean, nullable=False)
    id = Column(Integer, nullable=False, primary_key=True)
    user_id = Column(Integer, nullable=False, index=True)
    wallet = Column(String, nullable=False, index=True)
    chain = Column(Enum(WalletChain), nullable=False)

    def __repr__(self):
        return f"<AssociatedWallet(blockhash={self.blockhash},\
blocknumber={self.blocknumber},\
is_current={self.is_current},\
is_delete={self.is_delete},\
id={self.id},\
user_id={self.user_id},\
wallet={self.wallet}\
chain={self.chain})>"
