from sqlalchemy import Boolean, Column, Integer
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class ChallengeProfileCompletion(Base, RepresentableMixin):
    __tablename__ = "challenge_profile_completion"

    user_id = Column(
        Integer,
        primary_key=True,
    )
    profile_description = Column(Boolean, nullable=False)
    profile_name = Column(Boolean, nullable=False)
    profile_picture = Column(Boolean, nullable=False)
    profile_cover_photo = Column(Boolean, nullable=False)
    follows = Column(Boolean, nullable=False)
    favorites = Column(Boolean, nullable=False)
    reposts = Column(Boolean, nullable=False)
