from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    PrimaryKeyConstraint,
    String,
)
from sqlalchemy.dialects import postgresql
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class URSMContentNode(Base, RepresentableMixin):
    __tablename__ = "ursm_content_nodes"
    blockhash = Column(String, ForeignKey("blocks.blockhash"), nullable=True)
    blocknumber = Column(Integer, ForeignKey("blocks.number"), nullable=True)
    slot = Column(Integer, nullable=True)
    txhash = Column(String, default="", nullable=False)
    is_current = Column(Boolean, nullable=False)
    cnode_sp_id = Column(Integer, nullable=False)
    delegate_owner_wallet = Column(String, nullable=False)
    owner_wallet = Column(String, nullable=False)
    proposer_sp_ids = Column(postgresql.ARRAY(Integer), nullable=False)
    proposer_1_delegate_owner_wallet = Column(String, nullable=False)
    proposer_2_delegate_owner_wallet = Column(String, nullable=False)
    proposer_3_delegate_owner_wallet = Column(String, nullable=False)
    endpoint = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False)

    PrimaryKeyConstraint(is_current, cnode_sp_id, txhash)
