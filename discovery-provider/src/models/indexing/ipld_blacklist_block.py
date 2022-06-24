from src.models.base import Base
from src.models.model_utils import BlockMixin


class IPLDBlacklistBlock(Base, BlockMixin):
    __tablename__ = "ipld_blacklist_blocks"

    def __repr__(self):
        return f"<IPLDBlacklistBlock(blockhash={self.blockhash},\
    parenthash={self.parenthash},number={self.number}\
    is_current={self.is_current})>"
