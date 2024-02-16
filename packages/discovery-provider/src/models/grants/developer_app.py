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


class DeveloperApp(Base, RepresentableMixin):
    __tablename__ = "developer_apps"

    blockhash = Column(Text, nullable=False)
    blocknumber = Column(Integer, ForeignKey("blocks.number"), nullable=False)
    address = Column(String, primary_key=True, nullable=False, index=True)
    user_id = Column(Integer, nullable=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    is_personal_access = Column(Boolean, nullable=False, server_default=text("false"))
    is_delete = Column(Boolean, nullable=False, server_default=text("false"))
    is_current = Column(Boolean, nullable=False, primary_key=True)
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
