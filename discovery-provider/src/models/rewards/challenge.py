import enum

from sqlalchemy import Boolean, Column, Enum, Integer, String
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class ChallengeType(str, enum.Enum):
    boolean = "boolean"
    numeric = "numeric"
    aggregate = "aggregate"
    trending = "trending"


class Challenge(Base, RepresentableMixin):
    """Represents a particular challenge type"""

    __tablename__ = "challenges"

    # Identifies this challenge
    id = Column(String, primary_key=True)
    type = Column(
        Enum(ChallengeType),
        nullable=False,
    )
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
