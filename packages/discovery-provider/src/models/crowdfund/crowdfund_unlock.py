from sqlalchemy import Column, Integer

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class CrowdfundUnlock(Base, RepresentableMixin):
    __tablename__ = "crowdfund_unlocks"

    content_id = Column(Integer, primary_key=True, nullable=False)
    content_type = Column(Integer, primary_key=True, nullable=False, index=True)
