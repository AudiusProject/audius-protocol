from sqlalchemy import Column, Integer, String
from sqlalchemy.dialects import postgresql
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class EMLog(Base, RepresentableMixin):
    __tablename__ = "em_logs"

    txhash = Column(String, primary_key=True)
    entity_type = Column(String, nullable=False)
    entity_id = Column(Integer, nullable=False)
    blocknumber = Column(Integer, nullable=False)

    data = Column(postgresql.JSONB(), nullable=False)
