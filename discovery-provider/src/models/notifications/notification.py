from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, text
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
    notification_group_id = Column(ForeignKey("notification_group.id"))  # type: ignore
    type = Column(String, nullable=False)
    slot = Column(Integer)
    blocknumber = Column(Integer)
    timestamp = Column(DateTime, nullable=False)
    data = Column(postgresql.JSONB())  # type: ignore
    user_ids = Column(postgresql.ARRAY(Integer()), index=True)
