from sqlalchemy import Boolean, Column, ForeignKey, String
from sqlalchemy.orm import relationship
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class IpldBlacklist(Base, RepresentableMixin):
    __tablename__ = "ipld_blacklists"

    blockhash = Column(  # type: ignore
        ForeignKey("ipld_blacklist_blocks.blockhash"), primary_key=True, nullable=False
    )
    blocknumber = Column(  # type: ignore
        ForeignKey("ipld_blacklist_blocks.number"), nullable=False
    )
    ipld = Column(String, primary_key=True, nullable=False)
    is_blacklisted = Column(Boolean, primary_key=True, nullable=False)
    is_current = Column(Boolean, primary_key=True, nullable=False)

    ipld_blacklist_block = relationship(  # type: ignore
        "IpldBlacklistBlock",
        primaryjoin="IpldBlacklist.blockhash == IpldBlacklistBlock.blockhash",
    )
    ipld_blacklist_block1 = relationship(  # type: ignore
        "IpldBlacklistBlock",
        primaryjoin="IpldBlacklist.blocknumber == IpldBlacklistBlock.number",
    )
