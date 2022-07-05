import enum

from sqlalchemy import Boolean, Column, Enum, ForeignKey, Integer, String
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class WalletChain(str, enum.Enum):
    eth = "eth"
    sol = "sol"


class AssociatedWallet(Base, RepresentableMixin):
    __tablename__ = "associated_wallets"
    blockhash = Column(String, ForeignKey("blocks.blockhash"), nullable=False)
    blocknumber = Column(Integer, ForeignKey("blocks.number"), nullable=False)
    is_current = Column(Boolean, nullable=False)
    is_delete = Column(Boolean, nullable=False)
    id = Column(Integer, nullable=False, primary_key=True)
    user_id = Column(Integer, nullable=False, index=True)
    wallet = Column(String, nullable=False, index=True)
    chain = Column(Enum(WalletChain), nullable=False)
