from sqlalchemy import Column, DateTime, Integer, String, text
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class PlaysArchive(Base, RepresentableMixin):
    __tablename__ = "plays_archive"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer)
    source = Column(String)
    play_item_id = Column(Integer, nullable=False)
    created_at = Column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at = Column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )
    slot = Column(Integer)
    signature = Column(String)
    archived_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
