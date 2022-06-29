from sqlalchemy import Column, Index, Integer
from src.models.base import Base


class AggregateUser(Base):
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

    def __repr__(self):
        return f"<AggregateUser(\
user_id={self.user_id},\
track_count={self.track_count},\
playlist_count={self.playlist_count},\
album_count={self.album_count},\
follower_count={self.follower_count},\
following_count={self.following_count},\
repost_count={self.repost_count},\
track_save_count={self.track_save_count})>"
