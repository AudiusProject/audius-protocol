from sqlalchemy import Column, Index, Integer
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class AggregateUser(Base, RepresentableMixin):
    __tablename__ = "aggregate_user"

    user_id = Column(Integer, primary_key=True, nullable=False, index=True)
    track_count = Column(Integer, nullable=False)
    playlist_count = Column(Integer, nullable=False)
    album_count = Column(Integer, nullable=False)
    follower_count = Column(Integer, nullable=False)
    following_count = Column(Integer, nullable=False)
    repost_count = Column(Integer, nullable=False)
    track_save_count = Column(Integer, nullable=False)
    supporter_count = Column(Integer, nullable=False, server_default="0")
    supporting_count = Column(Integer, nullable=False, server_default="0")

    Index("aggregate_user_idx", "user_id", unique=True)
