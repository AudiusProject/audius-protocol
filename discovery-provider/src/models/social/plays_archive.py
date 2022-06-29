from sqlalchemy import Column, DateTime, Integer, String, func
from src.models.base import Base


class PlaysArchive(Base):
    __tablename__ = "plays_archive"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=True, index=False)
    source = Column(String, nullable=True, index=False)
    play_item_id = Column(Integer, nullable=False, index=False)
    slot = Column(Integer, nullable=True, index=True)
    signature = Column(String, nullable=True, index=False)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(
        DateTime, nullable=False, default=func.now(), onupdate=func.now()
    )
    archived_at = Column(
        DateTime, nullable=False, default=func.now(), onupdate=func.now()
    )

    def __repr__(self):
        return f"<Play(\
id={self.id},\
user_id={self.user_id},\
source={self.source},\
play_item_id={self.play_item_id}\
slot={self.slot}\
signature={self.signature}\
updated_at={self.updated_at}\
created_at={self.created_at}\
archived_at={self.archived_at})>"
