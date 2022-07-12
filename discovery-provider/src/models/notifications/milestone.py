import enum

from sqlalchemy import Column, DateTime, Integer, PrimaryKeyConstraint, String
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class MilestoneName(str, enum.Enum):
    LISTEN_COUNT = "LISTEN_COUNT"
    FOLLOWER_COUNT = "FOLLOWER_COUNT"
    TRACK_SAVE_COUNT = "TRACK_SAVE_COUNT"
    PLAYLIST_SAVE_COUNT = "PLAYLIST_SAVE_COUNT"
    TRACK_REPOST_COUNT = "TRACK_REPOST_COUNT"
    PLAYLIST_REPOST_COUNT = "PLAYLIST_REPOST_COUNT"


class Milestone(Base, RepresentableMixin):
    __tablename__ = "milestones"

    id = Column(Integer, nullable=False)
    name = Column(String, nullable=False)
    threshold = Column(Integer, nullable=False)
    blocknumber = Column(Integer, nullable=True)
    slot = Column(Integer, nullable=True)
    timestamp = Column(DateTime, nullable=False)
    PrimaryKeyConstraint(id, name, threshold)
