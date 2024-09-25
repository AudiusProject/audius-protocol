from sqlalchemy import Column, Integer, PrimaryKeyConstraint

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class CommentThread(Base, RepresentableMixin):
    __tablename__ = "comment_threads"

    comment_id = Column(Integer)
    parent_comment_id = Column(Integer)
    PrimaryKeyConstraint(parent_comment_id, comment_id)

    def get_attributes_dict(self):
        return {col.name: getattr(self, col.name) for col in self.__table__.columns}
