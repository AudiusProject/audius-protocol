from sqlalchemy import Boolean, Column, Integer, String

from src.models.base import Base
from src.models.model_utils import BlockMixin, RepresentableMixin


class Block(Base, BlockMixin, RepresentableMixin):
    __tablename__ = "blocks"
    blockhash = Column(String, primary_key=True)
    number = Column(Integer, nullable=True, unique=True)
    parenthash = Column(String)
    is_current = Column(Boolean)
