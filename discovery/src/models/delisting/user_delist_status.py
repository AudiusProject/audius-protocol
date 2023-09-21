import enum

from sqlalchemy import Boolean, Column, DateTime, Enum, Index, Integer

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class DelistUserReason(str, enum.Enum):
    STRIKE_THRESHOLD = "STRIKE_THRESHOLD"
    COPYRIGHT_SCHOOL = "COPYRIGHT_SCHOOL"
    MANUAL = "MANUAL"


class UserDelistStatus(Base, RepresentableMixin):
    __tablename__ = "user_delist_statuses"
    __table_args__ = (
        Index("user_delist_statuses_user_id_created_at", "user_id", "created_at"),
    )

    created_at = Column(DateTime(timezone=True), nullable=False, primary_key=True)
    user_id = Column(Integer, nullable=False, primary_key=True)
    delisted = Column(Boolean, nullable=False, primary_key=True)
    reason = Column(Enum(DelistUserReason), nullable=False)
