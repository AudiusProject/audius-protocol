from sqlalchemy import Column, Integer, PrimaryKeyConstraint
from sqlalchemy.dialects import postgresql

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class RevertBlock(Base, RepresentableMixin):
    __tablename__ = "revert_blocks"

    blocknumber = Column(Integer, nullable=False)
    prev_records = Column(postgresql.JSONB(), nullable=False)

    PrimaryKeyConstraint(blocknumber)
