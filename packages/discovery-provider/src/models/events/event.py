import enum

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    text,
)

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class EventType(str, enum.Enum):
    """Enum for event types"""
    REMIX_CONTEST = "remix_contest"
    LIVE_EVENT = "live_event"
    NEW_RELEASE = "new_release"

class EventEntityType(str, enum.Enum):
    """Enum for event entity types"""
    TRACK = "track"
    COLLECTION = "collection"
    USER = "user"


class Event(Base, RepresentableMixin):
    """Model class for events table.

    Table storing events in the Audius ecosystem.
    """
    __tablename__ = "events"

    id = Column(Integer, primary_key=True)
    event_type = Column(Enum(EventType), nullable=False, index=True)
    user_id = Column(Integer, nullable=False)
    entity_type = Column(Enum(EventEntityType), nullable=True, index=True)
    entity_id = Column(Integer, nullable=True)
    is_deleted = Column(Boolean, default=False)
    end_date = Column(DateTime, nullable=True)
    created_at = Column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at = Column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )
    txhash = Column(String, nullable=False, server_default=text("''"))
    blockhash = Column(String, nullable=False)
    blocknumber = Column(Integer, ForeignKey("blocks.number"), nullable=False)

    def get_attributes_dict(self):
        return {col.name: getattr(self, col.name) for col in self.__table__.columns}
