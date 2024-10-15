from sqlalchemy import Boolean, Column, DateTime, Integer, PrimaryKeyConstraint, Text

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class CommentNotificationSetting(Base, RepresentableMixin):
    __tablename__ = "comment_notification_settings"

    user_id = Column(Integer)
    entity_id = Column(Integer)
    entity_type = Column(Text)
    is_muted = Column(Boolean, default=False)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)
    PrimaryKeyConstraint(user_id, entity_id, entity_type)

    def get_attributes_dict(self):
        return {col.name: getattr(self, col.name) for col in self.__table__.columns}
