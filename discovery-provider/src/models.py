import logging
import enum

from jsonschema import ValidationError
from sqlalchemy.ext.declarative import declarative_base, declared_attr
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import validates
from sqlalchemy.sql import null
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    Enum,
    PrimaryKeyConstraint,
    Index,
    func,
)
from src.model_validator import ModelValidator

Base = declarative_base()
logger = logging.getLogger(__name__)


def validate_field_helper(field, value, model):
    # TODO: need to write custom validator for these datetime fields as jsonschema
    # validates datetime in format 2018-11-13T20:20:39+00:00, not a format we use
    # also not totally necessary as these fields are created server side
    if field in ('created_at', 'updated_at'):
        return value

    to_validate = {
        field: value
    }
    try:
        ModelValidator.validate(to_validate=to_validate, model=model, field=field)
    except ValidationError as e:
        value = get_default_value(field, value, model, e)
    except BaseException as e:
        logger.error(f"Validation failed: {e}")

    return value

def get_default_value(field, value, model, e):
    field_props = ModelValidator.get_properties_for_field(model, field)

    # type field from the schema. this can either be a string or list
    # required by JSONSchema, cannot be None
    schema_type_field = field_props['type']
    try:
        default_value = field_props['default']
    except KeyError:
        default_value = None

    # If the schema indicates this field is equal to object(if string) or contains object(if list) and
    # the default value isn't set in the schema, set to SQL null, otherwise JSONB columns get
    # set to string 'null'.
    # Other fields can be set to their regular defaults or None.
    if not default_value:
        # if schema_type_field is defined as a list, need to check if 'object' is in list, else check string
        if isinstance(schema_type_field, list) and 'object' in schema_type_field:
            default_value = null() # sql null
        elif schema_type_field == 'object':
            default_value = null() # sql null

    logger.warning(f"Validation: Setting the default value {default_value} for field {field} " \
        f"of type {schema_type_field} because of error: {e}")

    return default_value

def get_fields_to_validate(model):
    try:
        fields = ModelValidator.models_to_schema_and_fields_dict[model]['fields']
    except BaseException as e:
        logger.error(f"Validation failed: {e}. No validation will occur for {model}")
        fields = ['']

    return fields

class BlockMixin():

    @declared_attr
    def __tablename__(self, cls):
        return cls.__name__.lower()

    blockhash = Column(String, primary_key=True)
    number = Column(Integer, nullable=True, unique=True)
    parenthash = Column(String)
    is_current = Column(Boolean)


# inherits from BlockMixin
class Block(Base, BlockMixin):
    __tablename__ = "blocks"

    def __repr__(self):
        return f"<Block(blockhash={self.blockhash},\
parenthash={self.parenthash},number={self.number},\
is_current={self.is_current})>"


# inherits from BlockMixin
class IPLDBlacklistBlock(Base, BlockMixin):
    __tablename__ = "ipld_blacklist_blocks"

    def __repr__(self):
        return f"<IPLDBlacklistBlock(blockhash={self.blockhash},\
    parenthash={self.parenthash},number={self.number}\
    is_current={self.is_current})>"


class BlacklistedIPLD(Base):
    __tablename__ = "ipld_blacklists"

    blockhash = Column(String, ForeignKey("ipld_blacklist_blocks.blockhash"), nullable=False)
    blocknumber = Column(Integer, ForeignKey("ipld_blacklist_blocks.number"), nullable=False)
    ipld = Column(String, nullable=False)
    is_blacklisted = Column(Boolean, nullable=False)
    is_current = Column(Boolean, nullable=False, index=True)

    PrimaryKeyConstraint(blockhash, ipld, is_blacklisted, is_current)

    def __repr__(self):
        return f"<BlacklistedIPLD(blockhash={self.blockhash},\
blocknumber={self.blocknumber},ipld={self.ipld}\
is_blacklisted={self.is_blacklisted}, is_current={self.is_current})>"


class User(Base):
    __tablename__ = "users"

    blockhash = Column(String, ForeignKey("blocks.blockhash"), nullable=False)
    blocknumber = Column(Integer, ForeignKey("blocks.number"), nullable=False)
    user_id = Column(Integer, nullable=False)
    is_current = Column(Boolean, nullable=False)
    handle = Column(String)
    handle_lc = Column(String, index=True)
    wallet = Column(String, index=True)
    is_creator = Column(Boolean, nullable=False, default=False)
    is_verified = Column(Boolean, nullable=False, default=False, server_default='false')
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

    # Primary key has to be combo of all 3 is_current/creator_id/blockhash
    PrimaryKeyConstraint(is_current, user_id, blockhash)

    ModelValidator.init_model_schemas('User')
    fields = get_fields_to_validate('User')

    # unpacking args into @validates
    @validates(*fields)
    def validate_field(self, field, value):
        return validate_field_helper(field, value, 'User')

    def __repr__(self):
        return f"<User(blockhash={self.blockhash},\
blocknumber={self.blocknumber},\
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
updated_at={self.updated_at},\
created_at={self.created_at})>"


class Track(Base):
    __tablename__ = "tracks"

    blockhash = Column(String, ForeignKey("blocks.blockhash"), nullable=False)
    blocknumber = Column(Integer, ForeignKey("blocks.number"), nullable=False)
    track_id = Column(Integer, nullable=False)
    is_current = Column(Boolean, nullable=False)
    is_delete = Column(Boolean, nullable=False)
    owner_id = Column(Integer, nullable=False)
    route_id = Column(String, nullable=False)
    title = Column(Text, nullable=True)
    length = Column(Integer, nullable=True)
    cover_art = Column(String, nullable=True)
    cover_art_sizes = Column(String, nullable=True)
    tags = Column(String, nullable=True)
    genre = Column(String, nullable=True)
    mood = Column(String, nullable=True)
    credits_splits = Column(String, nullable=True)
    remix_of = Column(postgresql.JSONB, nullable=True)
    create_date = Column(String, nullable=True)
    release_date = Column(String, nullable=True)
    file_type = Column(String, nullable=True)
    description = Column(String, nullable=True)
    license = Column(String, nullable=True)
    isrc = Column(String, nullable=True)
    iswc = Column(String, nullable=True)
    track_segments = Column(postgresql.JSONB, nullable=False)
    metadata_multihash = Column(String, nullable=True)
    download = Column(postgresql.JSONB, nullable=True)
    updated_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, nullable=False)
    is_unlisted = Column(Boolean, nullable=False)
    field_visibility = Column(postgresql.JSONB, nullable=True)
    stem_of = Column(postgresql.JSONB, nullable=True)

    # Primary key has to be combo of all 3 is_current/creator_id/blockhash
    PrimaryKeyConstraint(is_current, track_id, blockhash)

    ModelValidator.init_model_schemas('Track')
    fields = get_fields_to_validate('Track')

    # unpacking args into @validates
    @validates(*fields)
    def validate_field(self, field, value):
        return validate_field_helper(field, value, 'Track')

    def __repr__(self):
        return (
            f"<Track("
            f"blockhash={self.blockhash},"
            f"blocknumber={self.blocknumber},"
            f"track_id={self.track_id},"
            f"is_current={self.is_current},"
            f"is_delete={self.is_delete},"
            f"owner_id={self.owner_id},"
            f"route_id={self.route_id},"
            f"title={self.title},"
            f"length={self.length},"
            f"cover_art={self.cover_art},"
            f"cover_art_sizes={self.cover_art_sizes},"
            f"tags={self.tags},"
            f"genre={self.genre},"
            f"mood={self.mood},"
            f"credits_splits={self.credits_splits},"
            f"remix_of={self.remix_of},"
            f"create_date={self.create_date},"
            f"release_date={self.release_date},"
            f"file_type={self.file_type},"
            f"description={self.description},"
            f"license={self.license},"
            f"isrc={self.isrc},"
            f"iswc={self.iswc},"
            f"track_segments={self.track_segments},"
            f"metadata_multihash={self.metadata_multihash},"
            f"download={self.download},"
            f"updated_at={self.updated_at},"
            f"created_at={self.created_at},"
            f"stem_of={self.stem_of}"
            ")>"
        )


class Playlist(Base):
    __tablename__ = "playlists"
    blockhash = Column(String, ForeignKey("blocks.blockhash"), nullable=False)
    blocknumber = Column(Integer, ForeignKey("blocks.number"), nullable=False)
    playlist_id = Column(Integer, nullable=False)
    playlist_owner_id = Column(Integer, nullable=False)
    is_album = Column(Boolean, nullable=False)
    is_private = Column(Boolean, nullable=False)
    playlist_name = Column(String)
    playlist_contents = Column(JSONB, nullable=False)
    playlist_image_multihash = Column(String)
    playlist_image_sizes_multihash = Column(String)
    description = Column(String)
    upc = Column(String)
    is_current = Column(Boolean, nullable=False)
    is_delete = Column(Boolean, nullable=False)
    updated_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, nullable=False)

    # Primary key has to be a combination of is_current/playlist_id/playlist_owner_id/blockhash
    PrimaryKeyConstraint(is_current, playlist_id, playlist_owner_id, blockhash)

    def __repr__(self):
        return f"<Playlist(blockhash={self.blockhash},\
blocknumber={self.blocknumber},\
playlist_id={self.playlist_id},\
playlist_owner_id={self.playlist_owner_id},\
is_album={self.is_album},\
is_private={self.is_private},\
playlist_name={self.playlist_name},\
playlist_contents={self.playlist_contents},\
playlist_image_multihash={self.playlist_image_multihash},\
playlist_image_sizes_multihash={self.playlist_image_sizes_multihash},\
description={self.description},\
upc={self.upc}\
is_current={self.is_current},\
is_delete={self.is_delete},\
updated_at={self.updated_at},\
created_at={self.created_at}>"

class RepostType(str, enum.Enum):
    track = 'track'
    playlist = 'playlist'
    album = 'album'


class Repost(Base):
    __tablename__ = "reposts"

    blockhash = Column(String, ForeignKey("blocks.blockhash"), nullable=False)
    blocknumber = Column(Integer, ForeignKey("blocks.number"), nullable=False)
    user_id = Column(Integer, nullable=False)
    repost_item_id = Column(Integer, nullable=False)
    repost_type = Column(Enum(RepostType), nullable=False)
    is_current = Column(Boolean, nullable=False)
    is_delete = Column(Boolean, nullable=False)
    created_at = Column(DateTime, nullable=False)

    PrimaryKeyConstraint(user_id, repost_item_id, repost_type, is_current, blockhash)

    def __repr__(self):
        return f"<Repost(blockhash={self.blockhash},\
blocknumber={self.blocknumber},\
user_id={self.user_id},\
repost_item_id={self.repost_item_id},\
repost_type={self.repost_type},\
is_current={self.is_current},\
is_delete={self.is_delete},\
created_at={self.created_at})>"


class Follow(Base):
    __tablename__ = "follows"

    blockhash = Column(String, ForeignKey("blocks.blockhash"), nullable=False)
    blocknumber = Column(Integer, ForeignKey("blocks.number"), nullable=False)
    follower_user_id = Column(Integer, nullable=False, index=True)
    followee_user_id = Column(Integer, nullable=False, index=True)
    is_current = Column(Boolean, nullable=False)
    is_delete = Column(Boolean, nullable=False)
    created_at = Column(DateTime, nullable=False)

    # Primary key has to be composite key of is_current/follower_user_id/followee_user_id/blockhash
    PrimaryKeyConstraint(is_current, follower_user_id, followee_user_id, blockhash)

    def __repr__(self):
        return f"<Follow(blockhash={self.blockhash},\
blocknumber={self.blocknumber},\
follower_user_id={self.follower_user_id},\
followee_user_id={self.followee_user_id},\
is_current={self.is_current},\
is_delete={self.is_delete},\
created_at={self.created_at}>"


class SaveType(str, enum.Enum):
    track = 'track'
    playlist = 'playlist'
    album = 'album'


class Save(Base):
    __tablename__ = "saves"

    blockhash = Column(String, ForeignKey("blocks.blockhash"), nullable=False)
    blocknumber = Column(Integer, ForeignKey("blocks.number"), nullable=False)
    user_id = Column(Integer, nullable=False)
    save_item_id = Column(Integer, nullable=False)
    save_type = Column(Enum(SaveType), nullable=False)
    created_at = Column(DateTime, nullable=False)
    is_current = Column(Boolean, nullable=False)
    is_delete = Column(Boolean, nullable=False)

    PrimaryKeyConstraint(is_current, user_id, save_item_id, save_type, blockhash)

    def __repr__(self):
        return f"<Save(blockhash={self.blockhash},\
blocknumber={self.blocknumber},\
user_id={self.user_id},\
save_item_id={self.save_item_id},\
created_at={self.created_at},\
save_type={self.save_type},\
is_current={self.is_current},\
is_delete={self.is_delete}>"

class Stem(Base):
    __tablename__ = "stems"

    parent_track_id = Column(Integer, nullable=False, index=False)
    child_track_id = Column(Integer, nullable=False, index=False)
    PrimaryKeyConstraint(parent_track_id, child_track_id)

    def __repr__(self):
        return f"<Stem(parent_track_id={self.parent_track_id},\
child_track_id={self.child_track_id})>"

class Remix(Base):
    __tablename__ = "remixes"

    parent_track_id = Column(Integer, nullable=False, index=False)
    child_track_id = Column(Integer, nullable=False, index=False)
    PrimaryKeyConstraint(parent_track_id, child_track_id)

    def __repr__(self):
        return f"<Remix(parent_track_id={self.parent_track_id},\
child_track_id={self.child_track_id}>"

class Play(Base):
    __tablename__ = "plays"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=True, index=False)
    source = Column(String, nullable=True, index=False)
    play_item_id = Column(Integer, nullable=False, index=False)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())

    Index('ix_plays_user_play_item', 'play_item_id', 'user_id', unique=False)
    Index('ix_plays_user_play_item_date', 'play_item_id', 'user_id', 'created_at', unique=False)

    def __repr__(self):
        return f"<Play(\
id={self.id},\
user_id={self.user_id},\
source={self.source},\
play_item_id={self.play_item_id}\
updated_at={self.updated_at}\
created_at={self.created_at}>"

class AggregatePlays(Base):
    __tablename__ = "aggregate_plays"

    play_item_id = Column(Integer, primary_key=True, nullable=False, index=True)
    count = Column(Integer, nullable=False, index=False)

    Index('play_item_id_idx', 'play_item_id', unique=False)

    def __repr__(self):
        return f"<AggregatePlays(\
play_item_id={self.play_iteme_id},\
count={self.count}>"

class RouteMetrics(Base):
    __tablename__ = "route_metrics"

    id = Column(Integer, primary_key=True)
    version = Column(String, nullable=True)
    route_path = Column(String, nullable=False)
    query_string = Column(String, nullable=True, default='')
    count = Column(Integer, nullable=False)
    ip = Column(String, nullable=False)
    timestamp = Column(DateTime, nullable=False, default=func.now())
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<RouteMetrics(\
version={self.version},\
route_path={self.route_path},\
query_string={self.query_string},\
count={self.count},\
ip={self.ip},\
timestamp={self.timestamp},\
created_at={self.created_at},\
updated_at={self.updated_at}"

class AppNameMetrics(Base):
    __tablename__ = "app_name_metrics"

    id = Column(Integer, primary_key=True)
    application_name = Column(String, nullable=False)
    count = Column(Integer, nullable=False)
    ip = Column(String, nullable=True)
    timestamp = Column(DateTime, nullable=False, default=func.now())
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<AppNameMetrics(\
application_name={self.application_name},\
count={self.count},\
ip={self.ip},\
timestamp={self.timestamp},\
created_at={self.created_at},\
updated_at={self.updated_at}"

class RouteMetricsDayMatview(Base):
    __tablename__ = "route_metrics_day_bucket"

    time = Column(DateTime, nullable=False, primary_key=True)
    unique_count = Column(Integer, nullable=False)
    count = Column(Integer, nullable=False)

    def __repr__(self):
        return f"<RouteMetricsDayMatview(\
unique_count={self.unique_count},\
count={self.count},\
time={self.time}>"

class RouteMetricsMonthMatview(Base):
    __tablename__ = "route_metrics_month_bucket"

    time = Column(DateTime, nullable=False, primary_key=True)
    unique_count = Column(Integer, nullable=False)
    count = Column(Integer, nullable=False)

    def __repr__(self):
        return f"<RouteMetricsMonthMatview(\
unique_count={self.unique_count},\
count={self.count},\
time={self.time}>"

class RouteMetricsTrailingWeek(Base):
    __tablename__ = "route_metrics_trailing_week"

    unique_count = Column(Integer, nullable=False)
    count = Column(Integer, nullable=False)
    PrimaryKeyConstraint(unique_count, count)

    def __repr__(self):
        return f"<RouteMetricsTrailingWeek(\
unique_count={self.unique_count},\
count={self.count}>"

class RouteMetricsTrailingMonth(Base):
    __tablename__ = "route_metrics_trailing_month"

    unique_count = Column(Integer, nullable=False)
    count = Column(Integer, nullable=False)
    PrimaryKeyConstraint(unique_count, count)

    def __repr__(self):
        return f"<RouteMetricsTrailingMonth(\
unique_count={self.unique_count},\
count={self.count}>"

class RouteMetricsAllTime(Base):
    __tablename__ = "route_metrics_all_time"

    unique_count = Column(Integer, nullable=False)
    count = Column(Integer, nullable=False)
    PrimaryKeyConstraint(unique_count, count)

    def __repr__(self):
        return f"<RouteMetricsTrailingAllTime(\
unique_count={self.unique_count},\
count={self.count}>"

class AppMetricsTrailingWeek(Base):
    __tablename__ = "app_name_metrics_trailing_week"

    count = Column(Integer, nullable=False)
    name = Column(String, nullable=False, primary_key=True)

    def __repr__(self):
        return f"<AppMetricsTrailingWeek(\
name={self.name},\
count={self.count}>"

class AppMetricsTrailingMonth(Base):
    __tablename__ = "app_name_metrics_trailing_month"

    count = Column(Integer, nullable=False)
    name = Column(String, nullable=False, primary_key=True)

    def __repr__(self):
        return f"<AppMetricsTrailingMonth(\
name={self.name},\
count={self.count}>"

class AppMetricsAllTime(Base):
    __tablename__ = "app_name_metrics_all_time"

    count = Column(Integer, nullable=False)
    name = Column(String, nullable=False, primary_key=True)

    def __repr__(self):
        return f"<AppMetricsAllTime(\
name={self.name},\
count={self.count}>"

class TagTrackUserMatview(Base):
    __tablename__ = "tag_track_user"

    tag = Column(String, nullable=False)
    track_id = Column(Integer, nullable=False)
    owner_id = Column(Integer, nullable=False)

    PrimaryKeyConstraint(tag, track_id, owner_id)

    def __repr__(self):
        return f"<TagTrackUserMatview(\
tag={self.tag},\
track_id={self.track_id},\
owner_id={self.owner_id}>"

class UserBalance(Base):
    __tablename__ = "user_balances"

    user_id = Column(Integer, nullable=False, primary_key=True)
    balance = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<UserBalance(\
user_id={self.user_id},\
balance={self.balance}>"
