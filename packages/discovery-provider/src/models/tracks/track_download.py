from sqlalchemy import Column, DateTime, Integer, String, text

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class TrackDownload(Base, RepresentableMixin):
    __tablename__ = "track_downloads"

    txhash = Column(String, nullable=False, primary_key=True)
    blocknumber = Column(Integer, nullable=False, primary_key=True)
    parent_track_id = Column(
        Integer, nullable=False, primary_key=True
    )  # The actual track (not the id of the stem)
    track_id = Column(Integer, nullable=False, primary_key=True)
    user_id = Column(Integer)
    created_at = Column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )
    city = Column(String)
    region = Column(String)
    country = Column(String)
