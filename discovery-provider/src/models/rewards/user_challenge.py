from sqlalchemy import (
    Boolean,
    Column,
    ForeignKey,
    Integer,
    PrimaryKeyConstraint,
    String,
)
from src.models.base import Base


class UserChallenge(Base):
    """Represents user progress through a particular challenge."""

    __tablename__ = "user_challenges"

    challenge_id = Column(String, ForeignKey("challenges.id"), nullable=False)
    user_id = Column(Integer, nullable=False)
    specifier = Column(String, nullable=False)
    is_complete = Column(Boolean, nullable=False)
    completed_blocknumber = Column(Integer, ForeignKey("blocks.number"), nullable=True)
    current_step_count = Column(Integer)

    PrimaryKeyConstraint(challenge_id, specifier)

    def __repr__(self):
        return f"<UserChallenge(\
challenge_id={self.challenge_id},\
user_id={self.user_id},\
specifier={self.specifier},\
is_complete={self.is_complete},\
completed_blocknumber={self.completed_blocknumber},\
current_step_count={self.current_step_count})>"
