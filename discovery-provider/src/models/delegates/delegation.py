from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, text
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class Delegation(Base, RepresentableMixin):
    __tablename__ = "delegations"

    shared_address = Column(String, primary_key=True, nullable=False, index=True)
    blockhash = Column(ForeignKey("blocks.blockhash"))  # type: ignore
    blocknumber = Column(ForeignKey("blocks.number"))  # type: ignore
    delegate_address = Column(String, nullable=False)
    user_id = Column(Integer, nullable=False)
    is_revoked = Column(Boolean, nullable=False, server_default=text("false"))
    is_approved = Column(Boolean, nullable=False, server_default=text("false"))
    created_at = Column(DateTime, nullable=False)
    txhash = Column(
        String,
        primary_key=True,
        nullable=False,
        server_default=text("''::character varying"),
    )
