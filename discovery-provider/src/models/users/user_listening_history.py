from sqlalchemy import Column, Integer
from sqlalchemy.dialects.postgresql import JSONB
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class UserListeningHistory(Base, RepresentableMixin):
    __tablename__ = "user_listening_history"

    user_id = Column(
        Integer,
        primary_key=True,
    )
    # listening_history JSON schema
    # [
    #   {"track_id": 1, "timestamp": "2011-01-01 00:00:00"},
    #   {"track_id": 2, "timestamp": "2012-02-02 00:00:00"}
    # ]
    listening_history = Column(JSONB(), nullable=False)
