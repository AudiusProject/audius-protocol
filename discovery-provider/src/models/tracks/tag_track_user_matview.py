from sqlalchemy import Column, Integer, PrimaryKeyConstraint, String
from src.models.base import Base


class TagTrackUserMatview(Base):
    __tablename__ = "tag_track_user"

    tag = Column(String, nullable=False)
    track_id = Column(Integer, nullable=False)
    owner_id = Column(Integer, nullable=False)

    PrimaryKeyConstraint(tag, track_id, owner_id)

    def __repr__(self):
        return f"<TagTrackUserMatview(\
tag={self.tag},\
track_id={self.track_id},\
owner_id={self.owner_id})>"
