import datetime
from sqlalchemy import (
    Column,
    Integer,
    DateTime,
    PrimaryKeyConstraint,
    Float,
)
from .models import Base


class RelatedArtist(Base):
    __tablename__ = "related_artists"

    user_id = Column(Integer, nullable=False)
    related_artist_user_id = Column(Integer, nullable=False)
    score = Column(Float, nullable=False)
    created = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)

    PrimaryKeyConstraint(user_id, related_artist_user_id)

    def __repr__(self):
        return f"<RelatedArtist(\
user_id={self.user_id},\
related_artist_user_id={self.related_artist_user_id},\
score={self.score},\
createds={self.created}>"
