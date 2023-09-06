from sqlalchemy import Column, String
from sqlalchemy.dialects import postgresql

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class CIDData(Base, RepresentableMixin):
    __tablename__ = "cid_data"

    cid = Column(String, primary_key=True)
    type = Column(String, nullable=False)
    data = Column(postgresql.JSONB(), nullable=False)
