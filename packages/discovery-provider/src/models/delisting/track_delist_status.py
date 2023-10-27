import enum

from sqlalchemy import Boolean, Column, DateTime, Enum, Index, Integer, String

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class DelistTrackReason(str, enum.Enum):
    DMCA = "DMCA"
    ACR = "ACR"
    MANUAL = "MANUAL"
    ACR_COUNTER_NOTICE = "ACR_COUNTER_NOTICE"
    DMCA_RETRACTION = "DMCA_RETRACTION"
    DMCA_COUNTER_NOTICE = "DMCA_COUNTER_NOTICE"
    DMCA_AND_ACR_COUNTER_NOTICE = "DMCA_AND_ACR_COUNTER_NOTICE"


class TrackDelistStatus(Base, RepresentableMixin):
    __tablename__ = "track_delist_statuses"
    __table_args__ = (
        Index("track_delist_statuses_owner_id_created_at", "owner_id", "created_at"),
        Index("track_delist_statuses_track_id_created_at", "track_id", "created_at"),
        Index("track_delist_statuses_track_cid_created_at", "track_cid", "created_at"),
    )

    created_at = Column(DateTime(timezone=True), nullable=False, primary_key=True)
    track_id = Column(Integer, nullable=False, primary_key=True)
    owner_id = Column(Integer, nullable=False)
    track_cid = Column(String, nullable=False)
    delisted = Column(Boolean, nullable=False, primary_key=True)
    reason = Column(Enum(DelistTrackReason), nullable=False)
