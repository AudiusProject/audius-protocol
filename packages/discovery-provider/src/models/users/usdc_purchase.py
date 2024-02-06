import enum

from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    DateTime,
    Enum,
    Integer,
    String,
    text,
)

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class PurchaseType(str, enum.Enum):
    track = "track"
    playlist = "playlist"
    album = "album"


class USDCPurchase(Base, RepresentableMixin):
    __tablename__ = "usdc_purchases"

    slot = Column(Integer, primary_key=True, nullable=False, index=True)
    signature = Column(String, primary_key=True, nullable=False)
    seller_user_id = Column(Integer, nullable=False, index=True)
    buyer_user_id = Column(Integer, nullable=False, index=True)
    amount = Column(BigInteger, nullable=False)
    extra_amount = Column(BigInteger, nullable=False, server_default=text("0"))
    content_type = Column(Enum(PurchaseType), nullable=False, index=True)
    content_id = Column(Integer, nullable=False)
    for_stream_access = Column(Boolean, nullable=False)
    for_download_access = Column(Boolean, nullable=False)

    created_at = Column(
        DateTime, nullable=False, index=True, server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at = Column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )
