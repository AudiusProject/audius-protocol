from sqlalchemy import Column, PrimaryKeyConstraint, String
from sqlalchemy.dialects.postgresql import JSONB

from .models import Base


class PersistentStoreEntry(Base):
    __tablename__ = "persistent_store"
    key = Column(String, nullable=False)
    value = Column(JSONB, nullable=True)

    PrimaryKeyConstraint(key)

    def __repr__(self):
        return f"<PersistentStoreEntry\
key={self.key},\
value={self.value},\
>"
