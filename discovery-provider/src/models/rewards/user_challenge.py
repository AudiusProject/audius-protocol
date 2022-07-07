from sqlalchemy import (
    Boolean,
    Column,
    ForeignKey,
    Integer,
    PrimaryKeyConstraint,
    String,
)
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class UserChallenge(Base, RepresentableMixin):
    """Represents user progress through a particular challenge."""

    __tablename__ = "user_challenges"

    challenge_id = Column(String, ForeignKey("challenges.id"), nullable=False)
    user_id = Column(Integer, nullable=False)
    specifier = Column(String, nullable=False)
    is_complete = Column(Boolean, nullable=False)
    completed_blocknumber = Column(Integer, ForeignKey("blocks.number"), nullable=True)
    current_step_count = Column(Integer)

    PrimaryKeyConstraint(challenge_id, specifier)
