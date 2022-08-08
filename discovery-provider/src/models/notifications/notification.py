from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import relationship
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
    notification_group_id = Column(Integer, ForeignKey("notification_group.id"))  # type: ignore
    type = Column(String, nullable=False)
    slot = Column(Integer)
    blocknumber = Column(Integer)
    timestamp = Column(DateTime, nullable=False)
    data = Column(postgresql.JSONB())  # type: ignore
    user_ids = Column(postgresql.ARRAY(Integer()), index=True)
    UniqueConstraint("specifier", "group_id", name="uq_notification")


class NotificationGroup(Base, RepresentableMixin):
    __tablename__ = "notification_group"
    __table_args__ = (Index("ix_notification_group", "user_id", "timestamp"),)

    id = Column(
        Integer,
        primary_key=True,
        server_default=text("nextval('notification_group_id_seq'::regclass)"),
    )
    notification_id = Column(Integer, ForeignKey("notification.id"))  # type: ignore
    slot = Column(Integer)
    blocknumber = Column(Integer)
    user_id = Column(Integer, nullable=False)
    timestamp = Column(DateTime, nullable=False)


Notification.notification_group = relationship(  # type: ignore
    "NotificationGroup",
    primaryjoin="Notification.notification_group_id == NotificationGroup.id",
)

NotificationGroup.notification = relationship(  # type: ignore
    "Notification",
    primaryjoin="NotificationGroup.notification_id == Notification.id",
)
