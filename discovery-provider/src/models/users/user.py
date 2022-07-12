from sqlalchemy import (
    ARRAY,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship, validates
from src.model_validator import ModelValidator
from src.models.base import Base
from src.models.model_utils import (
    RepresentableMixin,
    get_fields_to_validate,
    validate_field_helper,
)


class User(Base, RepresentableMixin):
    __tablename__ = "users"

    blockhash = Column(ForeignKey("blocks.blockhash"))  # type: ignore
    user_id = Column(Integer, primary_key=True, nullable=False)
    is_current = Column(Boolean, primary_key=True, nullable=False)
    handle = Column(String)
    wallet = Column(String, index=True)
    is_creator = Column(Boolean, nullable=False, server_default=text("false"))
    name = Column(Text)
    profile_picture = Column(String)
    cover_photo = Column(String)
    bio = Column(String)
    location = Column(String)
    metadata_multihash = Column(String)
    creator_node_endpoint = Column(String)
    blocknumber = Column(ForeignKey("blocks.number"), index=True)  # type: ignore
    is_verified = Column(Boolean, nullable=False, server_default=text("false"))
    created_at = Column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at = Column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )
    handle_lc = Column(String, index=True)
    cover_photo_sizes = Column(String)
    profile_picture_sizes = Column(String)
    primary_id = Column(Integer)
    secondary_ids = Column(ARRAY(Integer()))
    replica_set_update_signer = Column(String)
    has_collectibles = Column(Boolean, nullable=False, server_default=text("false"))
    txhash = Column(
        String,
        primary_key=True,
        nullable=False,
        server_default=text("''::character varying"),
    )
    playlist_library = Column(JSONB())
    is_deactivated = Column(
        Boolean, nullable=False, index=True, server_default=text("false")
    )
    slot = Column(Integer)
    user_storage_account = Column(String)
    user_authority_account = Column(String)

    block = relationship(  # type: ignore
        "Block", primaryjoin="User.blockhash == Block.blockhash"
    )
    block1 = relationship(  # type: ignore
        "Block", primaryjoin="User.blocknumber == Block.number"
    )

    ModelValidator.init_model_schemas("User")
    fields = get_fields_to_validate("User")

    # unpacking args into @validates
    @validates(*fields)
    def validate_field(self, field, value):
        return validate_field_helper(field, value, "User", getattr(User, field).type)
