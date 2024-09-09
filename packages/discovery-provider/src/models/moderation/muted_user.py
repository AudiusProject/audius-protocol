from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    PrimaryKeyConstraint,
    Text,
)

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class MutedUser(Base, RepresentableMixin):
    __tablename__ = "muted_users"

    muted_user_id = Column(Integer, nullable=False)
    user_id = Column(Integer, nullable=False)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)
    is_delete = Column(Boolean, default=False)
    txhash = Column(Text, nullable=False)
    blockhash = Column(Text, nullable=False)
    blocknumber = Column(Integer, ForeignKey("blocks.number"), nullable=False)

    PrimaryKeyConstraint(muted_user_id, user_id)

    def get_attributes_dict(self):
        return {col.name: getattr(self, col.name) for col in self.__table__.columns}
