from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, text
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class NotificationGroup(Base, RepresentableMixin):
    __tablename__ = "notification_group"
    __table_args__ = (Index("ix_notification_group", "user_id", "timestamp"),)

    id = Column(
        Integer,
        primary_key=True,
        server_default=text("nextval('notification_group_id_seq'::regclass)"),
    )
    notification_id = Column(ForeignKey("notification.id"))  # type: ignore
    slot = Column(Integer)
    blocknumber = Column(Integer)
    user_id = Column(Integer, nullable=False)
    timestamp = Column(DateTime, nullable=False)
