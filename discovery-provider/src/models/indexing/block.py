from src.models.base import Base
from src.models.model_utils import BlockMixin, RepresentableMixin


class Block(Base, BlockMixin, RepresentableMixin):
    __tablename__ = "blocks"
