from sqlalchemy import Column, Integer, String

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class CrowdfundContribution(Base, RepresentableMixin):
    __tablename__ = "crowdfund_contributions"

    ethereum_address = Column(String, primary_key=True, nullable=False)
    content_id = Column(Integer, primary_key=True, nullable=False)
    content_type = Column(Integer, primary_key=True, nullable=False, index=True)
    amount = Column(Integer, nullable=False)
