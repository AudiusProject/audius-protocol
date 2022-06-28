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


class URSMContentNode(Base):
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

    def __repr__(self):
        return f"<URSMContentNode(blockhash={self.blockhash},\
blocknumber={self.blocknumber},\
slot={self.slot},\
txhash={self.txhash},\
is_current={self.is_current},\
cnode_sp_id={self.cnode_sp_id},\
delegate_owner_wallet={self.delegate_owner_wallet},\
owner_wallet={self.owner_wallet},\
proposer_sp_ids={self.proposer_sp_ids},\
proposer_1_delegate_owner_wallet={self.proposer_1_delegate_owner_wallet},\
proposer_2_delegate_owner_wallet={self.proposer_2_delegate_owner_wallet},\
proposer_3_delegate_owner_wallet={self.proposer_3_delegate_owner_wallet},\
endpoint={self.endpoint})>"
