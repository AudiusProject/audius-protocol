from sqlalchemy import Column, Index, Integer
from sqlalchemy.dialects.postgresql import JSONB
from src.models.base import Base


class UserListeningHistory(Base):
    __tablename__ = "user_listening_history"

    user_id = Column(Integer, primary_key=True, nullable=False, index=True)
    listening_history = Column(JSONB, nullable=False, index=False)
    # listening_history JSON schema
    # [
    #   {"track_id": 1, "timestamp": "2011-01-01 00:00:00"},
    #   {"track_id": 2, "timestamp": "2012-02-02 00:00:00"}
    # ]

    Index("user_id", "listening_history", unique=True)

    def __repr__(self):
        return f"<UserListeningHistory(\
user_id={self.user_id},\
listening_history={self.listening_history})>"
