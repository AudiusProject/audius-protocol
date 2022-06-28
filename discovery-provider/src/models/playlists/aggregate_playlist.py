from sqlalchemy import Boolean, Column, Index, Integer
from src.models.base import Base


class AggregatePlaylist(Base):
    __tablename__ = "aggregate_playlist"

    playlist_id = Column(Integer, primary_key=True, nullable=False, index=True)
    is_album = Column(Boolean, nullable=False)
    repost_count = Column(Integer, nullable=False)
    save_count = Column(Integer, nullable=False)

    Index("aggregate_playlist_idx", "playlist_id", unique=True)

    def __repr__(self):
        return f"<AggregatePlaylist(\
playlist_id={self.playlist_id},\
is_album={self.is_album},\
repost_count={self.repost_count},\
save_count={self.save_count})>"
