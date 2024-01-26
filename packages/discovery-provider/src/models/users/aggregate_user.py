from sqlalchemy import BigInteger, Column, Integer, String, text

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class AggregateUser(Base, RepresentableMixin):
    __tablename__ = "aggregate_user"

    user_id = Column(Integer, primary_key=True)
    track_count = Column(BigInteger, server_default=text("0"))
    playlist_count = Column(BigInteger, server_default=text("0"))
    album_count = Column(BigInteger, server_default=text("0"))
    follower_count = Column(BigInteger, server_default=text("0"))
    following_count = Column(BigInteger, server_default=text("0"))
    repost_count = Column(BigInteger, server_default=text("0"))
    track_save_count = Column(BigInteger, server_default=text("0"))
    supporter_count = Column(Integer, nullable=False, server_default=text("0"))
    supporting_count = Column(Integer, nullable=False, server_default=text("0"))
    dominant_genre = Column(String, nullable=True)
    dominant_genre_count = Column(Integer, nullable=False, server_default=text("0"))
