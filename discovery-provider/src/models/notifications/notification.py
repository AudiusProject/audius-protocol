from sqlalchemy import (
    Boolean,
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
    # When notifications were first created, we accidentally swapped
    # supporter_rank_up (sent to the tip receiver)
    # with supporting_rank_up (sent to the tip sender) in the db trigger
    # on creation of these notifs. We added this type_v2 column to
    # help us migrate only notifications created before we fixed the trigger.
    # This column should not be used otherwise.
    type_v2 = Column(String, nullable=True)
    UniqueConstraint("group_id", "specifier", name="uq_notification")


class NotificationSeen(Base, RepresentableMixin):
    __tablename__ = "notification_seen"

    user_id = Column(Integer, nullable=False)
    blocknumber = Column(Integer)
    blockhash = Column(String)
    txhash = Column(String)
    seen_at = Column(DateTime, nullable=False)
    PrimaryKeyConstraint(user_id, seen_at)


class PlaylistSeen(Base, RepresentableMixin):
    __tablename__ = "playlist_seen"

    is_current = Column(Boolean, nullable=False)
    user_id = Column(Integer, nullable=False)
    playlist_id = Column(Integer, nullable=False)
    blocknumber = Column(Integer)
    blockhash = Column(String)
    txhash = Column(String)
    seen_at = Column(DateTime, nullable=False)
    PrimaryKeyConstraint(is_current, user_id, playlist_id, seen_at)
