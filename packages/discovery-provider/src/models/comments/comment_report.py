import os

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    PrimaryKeyConstraint,
    Text,
)

from src.models.base import Base
from src.models.model_utils import RepresentableMixin

COMMENT_REPORT_KARMA_THRESHOLD = os.getenv("comment_report_karma_threshold")


class CommentReport(Base, RepresentableMixin):
    __tablename__ = "comment_reports"

    comment_id = Column(Integer)
    user_id = Column(Integer)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    is_delete = Column(Boolean, nullable=False)
    txhash = Column(Text, nullable=False)
    blockhash = Column(Text, nullable=False)
    blocknumber = Column(Integer, ForeignKey("blocks.number"), nullable=False)

    PrimaryKeyConstraint(comment_id, user_id)

    def get_attributes_dict(self):
        return {col.name: getattr(self, col.name) for col in self.__table__.columns}
