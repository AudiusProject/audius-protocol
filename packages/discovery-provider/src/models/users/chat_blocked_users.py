from sqlalchemy import Column, DateTime, Integer

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class ChatBlockedUser(Base, RepresentableMixin):
    __tablename__ = "chat_blocked_users"

    blocker_user_id = Column(Integer, primary_key=True, nullable=False)
    blockee_user_id = Column(Integer, primary_key=True, nullable=False, index=True)
    created_at = Column(DateTime, nullable=False)
