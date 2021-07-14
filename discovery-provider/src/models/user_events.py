from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    ForeignKey
)
from .models import Base

class UserEvents(Base):
    """
    User events track event metadata a user may produce as a part of their interaction
    with the protocol over time, e.g. who was the user referred by? has the user signed in on a mobile app?

    Events are stored as a separate table from Users as it is assumed that the table of events
    will be fairly sparse as not all users will have produced all types of events.
    While a JSONB column in the User table would be sufficient for many event types, in order to query
    across all users that may or may not have produced a certain event, they are broken into separate fields.

    Future events may wish to take on the shape of JSONB data within the UserEvents table itself.
    """
    __tablename__ = "user_events"
    blockhash = Column(String, ForeignKey("blocks.blockhash"), nullable=False)
    blocknumber = Column(Integer, ForeignKey("blocks.number"), nullable=False)
    is_current = Column(Boolean, nullable=False)
    id = Column(Integer, nullable=False, primary_key=True)
    user_id = Column(Integer, nullable=False, index=True)

    referrer = Column(Integer, nullable=True)
    is_mobile_user = Column(Boolean, nullable=False, default=False)

    def __repr__(self):
        return f"<UserEvents(blockhash={self.blockhash},\
blocknumber={self.blocknumber},\
is_current={self.is_current},\
id={self.id},\
user_id={self.user_id},\
referrer={self.referrer},\
is_mobile_user={self.is_mobile_user})>"
