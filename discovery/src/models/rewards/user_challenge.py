from sqlalchemy import Boolean, Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class UserChallenge(Base, RepresentableMixin):
    """Represents user progress through a particular challenge."""

    __tablename__ = "user_challenges"

    challenge_id = Column(  # type: ignore
        ForeignKey("challenges.id"), primary_key=True, nullable=False, index=True
    )
    user_id = Column(Integer, nullable=False)
    specifier = Column(String, primary_key=True, nullable=False)
    is_complete = Column(Boolean, nullable=False)
    current_step_count = Column(Integer)
    completed_blocknumber = Column(Integer)

    challenge = relationship("Challenge")  # type: ignore
