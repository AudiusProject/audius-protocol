from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    text,
)

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class Grant(Base, RepresentableMixin):
    __tablename__ = "grants"

    blockhash = Column(Text, nullable=False)
    blocknumber = Column(Integer, ForeignKey("blocks.number"), nullable=False)
    grantee_address = Column(String, primary_key=True, nullable=False)
    user_id = Column(Integer, primary_key=True, nullable=False)
    is_revoked = Column(Boolean, nullable=False, server_default=text("false"))
    is_approved = Column(Boolean, nullable=True)
    is_current = Column(Boolean, primary_key=True, nullable=False)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)
    txhash = Column(
        String,
        primary_key=True,
        nullable=False,
        server_default=text("''::character varying"),
    )

    def get_attributes_dict(self):
        return {col.name: getattr(self, col.name) for col in self.__table__.columns}
