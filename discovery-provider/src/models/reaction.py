from sqlalchemy import Column, DateTime, Integer, String

from .models import Base, RepresentableMixin


class Reaction(Base, RepresentableMixin):
    __tablename__ = "reactions"

    id = Column(Integer, nullable=False, primary_key=True)
    slot = Column(Integer, nullable=False)
    reaction = Column(Integer, nullable=False)
    sender_wallet = Column(String, nullable=False)
    entity_type = Column(String, nullable=False)
    entity_id = Column(String, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    tx_signature = Column(String, nullable=True)
