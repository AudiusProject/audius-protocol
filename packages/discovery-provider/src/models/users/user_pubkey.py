from sqlalchemy import Column, Integer, Text

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class UserPubkey(Base, RepresentableMixin):
    """Model class for the user_pubkeys table.

    Table storing public keys for users.
    """

    __tablename__ = "user_pubkeys"

    user_id = Column(Integer, primary_key=True, nullable=False)
    pubkey_base64 = Column(Text, nullable=False)
