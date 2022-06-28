from sqlalchemy import Boolean, Column, Integer
from src.models.base import Base


class ProfileCompletionChallenge(Base):
    __tablename__ = "challenge_profile_completion"

    user_id = Column(Integer, nullable=False, primary_key=True)
    profile_description = Column(Boolean, nullable=False)
    profile_name = Column(Boolean, nullable=False)
    profile_picture = Column(Boolean, nullable=False)
    profile_cover_photo = Column(Boolean, nullable=False)
    follows = Column(Boolean, nullable=False)
    favorites = Column(Boolean, nullable=False)
    reposts = Column(Boolean, nullable=False)

    def __repr__(self):
        return f"<ProfileCompletionChallenge,\
user_id={self.user_id},\
profile_description={self.profile_description},\
profile_name={self.profile_name},\
profile_picture={self.profile_picture},\
profile_cover_photo={self.profile_cover_photo},\
follows_complete={self.follows},\
favorites_complete={self.favorites},\
reposts_complete={self.reposts})>"
