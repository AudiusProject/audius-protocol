from sqlalchemy import Boolean, Column, Index, Integer, String, text
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class UserEvent(Base, RepresentableMixin):
    """
    User events track event metadata a user may produce as a part of their interaction
    with the protocol over time, e.g. who was the user referred by? has the user signed in on a mobile app?

    Events are stored as a separate table from Users as it is assumed that the table of events
    will be fairly sparse as not all users will have produced all types of events.
    While a JSONB column in the User table would be sufficient for many event types, in order to query
    across all users that may or may not have produced a certain event, they are broken into separate fields.

    Future events may wish to take on the shape of JSONB data within the UserEvent table itself.
    """

    __tablename__ = "user_events"
    __table_args__ = (Index("user_events_user_id_idx", "user_id", "is_current"),)

    id = Column(
        Integer,
        primary_key=True,
    )
    blockhash = Column(String)
    blocknumber = Column(Integer)
    is_current = Column(Boolean, nullable=False)
    user_id = Column(Integer, nullable=False)
    referrer = Column(Integer)
    is_mobile_user = Column(Boolean, nullable=False, server_default=text("false"))
    slot = Column(Integer)
