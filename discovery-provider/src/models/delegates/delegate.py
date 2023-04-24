from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, text
from sqlalchemy.dialects.postgresql import JSONB
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class Delegate(Base, RepresentableMixin):
    __tablename__ = "delegates"

    blockhash = Column(ForeignKey("blocks.blockhash"))  # type: ignore
    blocknumber = Column(ForeignKey("blocks.number"))  # type: ignore
    address = Column(String, primary_key=True, nullable=False, index=True)
    user_id = Column(Integer, nullable=True, index=True)
    name = Column(String, nullable=False, index=False)
    is_personal_access = Column(Boolean, nullable=False, server_default=text("false"))
    is_revoked = Column(Boolean, nullable=False, server_default=text("false"))
    permissions = Column(JSONB())

    created_at = Column(DateTime, nullable=False)
    txhash = Column(
        String,
        primary_key=True,
        nullable=False,
        server_default=text("''::character varying"),
    )
