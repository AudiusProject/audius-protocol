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


class DashboardWalletUser(Base, RepresentableMixin):
    __tablename__ = "dashboard_wallet_users"

    wallet = Column(String, primary_key=True, nullable=False)
    user_id = Column(Integer, nullable=False)
    is_delete = Column(Boolean, nullable=False, server_default=text("false"))
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)
    txhash = Column(
        String,
        primary_key=True,
        nullable=False,
        server_default=text("''::character varying"),
    )
    blockhash = Column(Text, ForeignKey("blocks.blockhash"), nullable=False)
    blocknumber = Column(Integer, ForeignKey("blocks.number"), nullable=False)

    def get_attributes_dict(self):
        return {col.name: getattr(self, col.name) for col in self.__table__.columns}
