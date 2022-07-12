from sqlalchemy import Boolean, Column, Index, Integer
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class AggregatePlaylist(Base, RepresentableMixin):
    __tablename__ = "aggregate_playlist"

    playlist_id = Column(Integer, primary_key=True, nullable=False, index=True)
    is_album = Column(Boolean, nullable=False)
    repost_count = Column(Integer, nullable=False)
    save_count = Column(Integer, nullable=False)

    Index("aggregate_playlist_idx", "playlist_id", unique=True)
