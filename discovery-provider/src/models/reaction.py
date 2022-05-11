from sqlalchemy import Column, DateTime, Integer, String

from .models import Base, RepresentableMixin


class Reaction(Base, RepresentableMixin):
    __tablename__ = "reactions"

    id = Column(Integer, nullable=False, primary_key=True)
    slot = Column(Integer, nullable=False)
    reaction_value = Column(Integer, nullable=False)
    sender_wallet = Column(String, nullable=False)
    reaction_type = Column(String, nullable=False)
    reacted_to = Column(String, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    tx_signature = Column(String, nullable=True)
