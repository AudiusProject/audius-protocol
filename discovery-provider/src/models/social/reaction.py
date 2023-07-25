from sqlalchemy import Column, DateTime, Index, Integer, String

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class Reaction(Base, RepresentableMixin):
    __tablename__ = "reactions"
    __table_args__ = (
        Index("ix_reactions_reacted_to_reaction_type", "reacted_to", "reaction_type"),
    )

    id = Column(
        Integer,
        primary_key=True,
    )
    slot = Column(Integer, nullable=False, index=True)
    reaction_value = Column(Integer, nullable=False)
    sender_wallet = Column(String, nullable=False)
    reaction_type = Column(String, nullable=False)
    reacted_to = Column(String, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    tx_signature = Column(String)
