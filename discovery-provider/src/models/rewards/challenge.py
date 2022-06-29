import enum

from sqlalchemy import Boolean, Column, Enum, Integer, String
from src.models.base import Base


class ChallengeType(str, enum.Enum):
    boolean = "boolean"
    numeric = "numeric"
    aggregate = "aggregate"
    trending = "trending"


class Challenge(Base):
    """Represents a particular challenge type"""

    __tablename__ = "challenges"

    # Identifies this challenge
    id = Column(String, primary_key=True, nullable=False, index=True)
    type = Column(Enum(ChallengeType), nullable=False)
    # The amount of wAudio to disburse (8 decimals)
    amount = Column(String, nullable=False)
    # Whether the challenge is currently active
    active = Column(Boolean, nullable=False)
    # Optional field to support numeric challenges,
    # representing the number of steps to complete the challenge
    step_count = Column(Integer)
    # Optional field for non-retroactive challenges -
    # if set, events emitted prior to the starting_block
    # will be ignord.
    starting_block = Column(Integer)

    def __repr__(self):
        return f"<Challenge(\
id={self.id},\
type={self.type},\
amount={self.amount},\
active={self.active},\
step_count={self.step_count},\
starting_block={self.starting_block},\
"
