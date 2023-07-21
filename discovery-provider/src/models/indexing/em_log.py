from sqlalchemy import Column, Integer, PrimaryKeyConstraint, String
from sqlalchemy.dialects import postgresql
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class EMLog(Base, RepresentableMixin):
    __tablename__ = "em_logs"

    txhash = Column(String, nullable=False)
    entity_type = Column(String, nullable=False)
    blocknumber = Column(Integer, nullable=False)
    prev_record = Column(postgresql.JSONB(), nullable=False)
    
    PrimaryKeyConstraint(entity_type, txhash)
