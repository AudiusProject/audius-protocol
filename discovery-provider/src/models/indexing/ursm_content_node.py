from sqlalchemy import (
    ARRAY,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    text,
)
from sqlalchemy.orm import relationship
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class UrsmContentNode(Base, RepresentableMixin):
    __tablename__ = "ursm_content_nodes"

    blockhash = Column(ForeignKey("blocks.blockhash"))  # type: ignore
    blocknumber = Column(ForeignKey("blocks.number"))  # type: ignore
    created_at = Column(DateTime, nullable=False)
    is_current = Column(Boolean, primary_key=True, nullable=False)
    cnode_sp_id = Column(Integer, primary_key=True, nullable=False)
    delegate_owner_wallet = Column(String, nullable=False)
    owner_wallet = Column(String, nullable=False)
    proposer_sp_ids = Column(ARRAY(Integer()), nullable=False)
    proposer_1_delegate_owner_wallet = Column(String, nullable=False)
    proposer_2_delegate_owner_wallet = Column(String, nullable=False)
    proposer_3_delegate_owner_wallet = Column(String, nullable=False)
    endpoint = Column(String)
    txhash = Column(
        String,
        primary_key=True,
        nullable=False,
        server_default=text("''::character varying"),
    )
    slot = Column(Integer)

    block = relationship(  # type: ignore
        "Block", primaryjoin="UrsmContentNode.blockhash == Block.blockhash"
    )
    block1 = relationship(  # type: ignore
        "Block", primaryjoin="UrsmContentNode.blocknumber == Block.number"
    )
