import enum

from sqlalchemy import Column, DateTime, Enum, String

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class DelistEntity(str, enum.Enum):
    TRACKS = "TRACKS"
    USERS = "USERS"


class DelistStatusCursor(Base, RepresentableMixin):
    __tablename__ = "delist_status_cursor"
    host = Column(String, primary_key=True)
    entity = Column(Enum(DelistEntity), nullable=False, primary_key=True)
    created_at = Column(DateTime(timezone=True), nullable=False)
