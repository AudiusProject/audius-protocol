from sqlalchemy import (
    Column,
    DateTime,
    Integer,
    PrimaryKeyConstraint,
    String,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects import postgresql
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class Notification(Base, RepresentableMixin):
    __tablename__ = "notification"

    id = Column(
        Integer,
        primary_key=True,
        server_default=text("nextval('notification_id_seq'::regclass)"),
    )
    specifier = Column(String, nullable=False)
    group_id = Column(String, nullable=False)
    type = Column(String, nullable=False)
    slot = Column(Integer)
    blocknumber = Column(Integer)
    timestamp = Column(DateTime, nullable=False)
    data = Column(postgresql.JSONB())  # type: ignore
    user_ids = Column(postgresql.ARRAY(Integer()), index=True)
    UniqueConstraint("group_id", "specifier", name="uq_notification")


class NotificationSeen(Base, RepresentableMixin):
    __tablename__ = "notification_seen"

    user_id = Column(Integer, nullable=False)
    blocknumber = Column(Integer)
    blockhash = Column(String)
    txhash = Column(String)
    seen_at = Column(DateTime, nullable=False)
    PrimaryKeyConstraint(user_id, seen_at)
