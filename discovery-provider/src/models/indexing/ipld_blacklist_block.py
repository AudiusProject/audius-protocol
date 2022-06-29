from src.models.base import Base
from src.models.model_utils import BlockMixin, RepresentableMixin


class IPLDBlacklistBlock(Base, BlockMixin, RepresentableMixin):
    __tablename__ = "ipld_blacklist_blocks"
