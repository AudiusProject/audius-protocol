from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    PrimaryKeyConstraint,
    String,
    Text,
)
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import validates
from src.model_validator import ModelValidator
from src.models.base import Base
from src.models.model_utils import get_fields_to_validate, validate_field_helper


class User(Base):
    __tablename__ = "users"

    blockhash = Column(String, ForeignKey("blocks.blockhash"), nullable=True)
    blocknumber = Column(Integer, ForeignKey("blocks.number"), nullable=True)
    slot = Column(Integer, nullable=True)
    user_storage_account = Column(String, nullable=True)
    user_authority_account = Column(String, nullable=True)
    txhash = Column(String, default="", nullable=False)
    user_id = Column(Integer, nullable=False)
    is_current = Column(Boolean, nullable=False)
    handle = Column(String)
    handle_lc = Column(String, index=True)
    wallet = Column(String, index=True)
    is_creator = Column(Boolean, nullable=False, default=False)
    is_verified = Column(Boolean, nullable=False, default=False, server_default="false")
    name = Column(Text)
    profile_picture = Column(String)
    profile_picture_sizes = Column(String)
    cover_photo = Column(String)
    cover_photo_sizes = Column(String)
    bio = Column(String)
    location = Column(String)
    metadata_multihash = Column(String)
    creator_node_endpoint = Column(String)
    updated_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, nullable=False)
    primary_id = Column(Integer, nullable=True)
    secondary_ids = Column(postgresql.ARRAY(Integer), nullable=True)
    replica_set_update_signer = Column(String, nullable=True)
    has_collectibles = Column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    playlist_library = Column(JSONB, nullable=True)
    is_deactivated = Column(
        Boolean, nullable=False, default=False, server_default="false", index=True
    )

    # NOTE: There is no actualy primary key in the DB
    PrimaryKeyConstraint(is_current, user_id, txhash)

    ModelValidator.init_model_schemas("User")
    fields = get_fields_to_validate("User")

    # unpacking args into @validates
    @validates(*fields)
    def validate_field(self, field, value):
        return validate_field_helper(field, value, "User", getattr(User, field).type)

    def __repr__(self):
        return f"<User(blockhash={self.blockhash},\
blocknumber={self.blocknumber},\
txhash={self.txhash},\
slot={self.slot},\
user_storage_account={self.user_storage_account},\
user_authority_account={self.user_authority_account},\
user_id={self.user_id},\
is_current={self.is_current},\
handle={self.handle},\
wallet={self.wallet},\
is_creator={self.is_creator},\
name={self.name},\
profile_pic={self.profile_picture},\
profile_pic_sizes={self.profile_picture_sizes},\
cover_photo={self.cover_photo},\
cover_photo_sizes={self.cover_photo_sizes},\
bio={self.bio},\
location={self.location},\
metadata_multihash={self.metadata_multihash},\
creator_node_endpoint={self.creator_node_endpoint},\
primary_id={self.primary_id},\
secondary_ids={self.secondary_ids},\
replica_set_update_signer={self.replica_set_update_signer},\
updated_at={self.updated_at},\
created_at={self.created_at})>"
