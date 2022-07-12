from sqlalchemy import (
    Boolean,
    Column,
    ForeignKey,
    Integer,
    PrimaryKeyConstraint,
    String,
)
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class BlacklistedIPLD(Base, RepresentableMixin):
    __tablename__ = "ipld_blacklists"

    blockhash = Column(
        String, ForeignKey("ipld_blacklist_blocks.blockhash"), nullable=False
    )
    blocknumber = Column(
        Integer, ForeignKey("ipld_blacklist_blocks.number"), nullable=False
    )
    ipld = Column(String, nullable=False)
    is_blacklisted = Column(Boolean, nullable=False)
    is_current = Column(Boolean, nullable=False, index=True)

    PrimaryKeyConstraint(blockhash, ipld, is_blacklisted, is_current)
