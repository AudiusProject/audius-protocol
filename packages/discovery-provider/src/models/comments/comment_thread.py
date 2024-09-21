from sqlalchemy import Column, DateTime, ForeignKey, Integer, PrimaryKeyConstraint, Text

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class CommentThread(Base, RepresentableMixin):
    __tablename__ = "comment_threads"

    comment_id = Column(Integer)
    parent_comment_id = Column(Integer)
    PrimaryKeyConstraint(comment_id, parent_comment_id)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)
    txhash = Column(Text, nullable=False)
    blockhash = Column(Text, nullable=False)
    blocknumber = Column(Integer, ForeignKey("blocks.number"), nullable=False)

    def get_attributes_dict(self):
        return {col.name: getattr(self, col.name) for col in self.__table__.columns}
