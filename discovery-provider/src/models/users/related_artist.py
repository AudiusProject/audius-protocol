from sqlalchemy import Column, DateTime, Float, Index, Integer, text
from src.models.base import Base


class RelatedArtist(Base):
    __tablename__ = "related_artists"
    __table_args__ = (
        Index(
            "related_artists_related_artist_id_idx", "related_artist_user_id", "user_id"
        ),
    )

    user_id = Column(Integer, primary_key=True, nullable=False)
    related_artist_user_id = Column(Integer, primary_key=True, nullable=False)
    score = Column(Float(53), nullable=False)
    created_at = Column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )
