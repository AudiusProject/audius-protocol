"""repair_poorly_sorted_tracks

Tracks on audius created before datetime(2021, 5, 19, 15, 27, 45) contain improperly sorted segments.
See https://github.com/AudiusProject/audius-protocol/commit/27576f58c4cdfa8e18e3f90f2c427d1e4a7eb51c
for the forward looking fix.

This migration retroactively repairs older tracks

Revision ID: c8d2be7dcccc
Revises: d9992d2d598c
Create Date: 2021-05-17 15:33:56.498582

"""
import logging
from typing import Any
from datetime import datetime
from jsonschema import ValidationError
from sqlalchemy.dialects import postgresql
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql.functions import GenericFunction
from sqlalchemy.orm import sessionmaker, validates
from sqlalchemy.sql import null
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    PrimaryKeyConstraint,
)
from alembic import op
from src.model_validator import ModelValidator

# revision identifiers, used by Alembic.
revision = "c8d2be7dcccc"
down_revision = "d9992d2d598c"
branch_labels = None
depends_on = None

Base: Any = declarative_base()


# field_type is the sqlalchemy type from the model object
def validate_field_helper(field, value, model, field_type):
    # TODO: need to write custom validator for these datetime fields as jsonschema
    # validates datetime in format 2018-11-13T20:20:39+00:00, not a format we use
    # also not totally necessary as these fields are created server side
    if field in ("created_at", "updated_at"):
        return value

    # remove null characters from varchar and text fields
    # Postgres does not support these well and it throws this error if you try to insert
    # `Fatal error in main loop A string literal cannot contain NUL (0x00) characters`
    # the fix is to replace those characters with empty with empty string
    # https://stackoverflow.com/questions/1347646/postgres-error-on-insert-error-invalid-byte-sequence-for-encoding-utf8-0x0
    if type(field_type) in (String, Text) and value:
        value = value.replace("\x00", "")

    to_validate = {field: value}
    try:
        ModelValidator.validate(to_validate=to_validate, model=model, field=field)
    except ValidationError as e:
        value = get_default_value(field, value, model, e)
    except BaseException as e:
        logger.error(f"Validation failed: {e}")

    return value


def get_fields_to_validate(model):
    try:
        fields = ModelValidator.models_to_schema_and_fields_dict[model]["fields"]
    except BaseException as e:
        logger.error(f"Validation failed: {e}. No validation will occur for {model}")
        fields = [""]

    return fields


def get_default_value(field, value, model, e):
    field_props = ModelValidator.get_properties_for_field(model, field)

    # type field from the schema. this can either be a string or list
    # required by JSONSchema, cannot be None
    schema_type_field = field_props["type"]
    try:
        default_value = field_props["default"]
    except KeyError:
        default_value = None

    # If the schema indicates this field is equal to object(if string) or contains object(if list) and
    # the default value isn't set in the schema, set to SQL null, otherwise JSONB columns get
    # set to string 'null'.
    # Other fields can be set to their regular defaults or None.
    if not default_value:
        # if schema_type_field is defined as a list, need to check if 'object' is in list, else check string
        if isinstance(schema_type_field, list) and "object" in schema_type_field:
            default_value = null()  # sql null
        elif schema_type_field == "object":
            default_value = null()  # sql null

    logger.warning(
        f"Validation: Setting the default value {default_value} for field {field} "
        f"of type {schema_type_field} because of error: {e}"
    )

    return default_value


# Copy of Track model at time of migration to avoid deps on changing models
class Track(Base):
    __tablename__ = "tracks"

    blockhash = Column(String, ForeignKey("blocks.blockhash"), nullable=False)
    blocknumber = Column(Integer, ForeignKey("blocks.number"), nullable=False)
    txhash = Column(String, default="", nullable=False)
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

    PrimaryKeyConstraint(is_current, track_id, blockhash, txhash)

    ModelValidator.init_model_schemas("Track")
    fields = get_fields_to_validate("Track")

    # unpacking args into @validates
    @validates(*fields)
    def validate_field(self, field, value):
        return validate_field_helper(field, value, "Track", getattr(Track, field).type)

    def __repr__(self):
        return (
            f"<Track("
            f"blockhash={self.blockhash},"
            f"blocknumber={self.blocknumber},"
            f"txhash={self.txhash},"
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


class jsonb_array_length(GenericFunction):  # pylint: disable=too-many-ancestors
    name = "jsonb_array_length"
    type = Integer


@compiles(jsonb_array_length, "postgresql")
def compile_jsonb_array_length(element, compiler, **kw):
    return "%s(%s)" % (element.name, compiler.process(element.clauses))


logger = logging.getLogger(__name__)

Session = sessionmaker()
CUTOFF_DATE = datetime.fromtimestamp(1621456065)
FMT = "segment%03d.ts"


def fix_segments(segments):
    """
    Fixes segments from a string sorted %03d order to a proper integer based order.

    Currently, we observe incorrect segment orders of
    099.ts
    100.ts
    1001.ts
    1002.ts
    ...
    101.ts

    This method takes in a list of segments and re orders them, returning the proper order.
    It does this by replicating a sort on the %03d naming schema and captures the indexes that move
    when that happens and then uses that relationship to back out what the original order should be.
    """
    fixed_segments = [None] * len(segments)
    # Produce tuples for the total length of segments (number, actual segment name), e.g. (0, segment000.ts)
    tuples = [(i, FMT % i) for i in range(0, len(segments))]
    # Sort segments by their stored file name fmt. This mirrors the error.
    sorted_tuples = sorted(tuples, key=lambda x: x[1])

    # Re-map out the tuples, capturing the actual index they should be at. This gives us
    # {0: 0, 1: 1, ..., 101: 1000, ..., 111: 101, ...}
    segment_map = {}
    for i in range(len(sorted_tuples)):
        proper_index = sorted_tuples[i][0]
        segment_map[i] = proper_index

    # Produce our final order and return
    for mapping in segment_map.items():
        fixed_segments[mapping[1]] = segments[mapping[0]]

    return fixed_segments


def unfix_segments(segments):
    """
    Un-fixes segments (for down migration).
    Identical to fix_segments, except proper_index and i are swapped to revert the change.
    """
    unfixed_segments = [None] * len(segments)
    tuples = [(i, FMT % i) for i in range(0, len(segments))]
    sorted_tuples = sorted(tuples, key=lambda x: x[1])
    segment_map = {}
    for i in range(len(sorted_tuples)):
        proper_index = sorted_tuples[i][0]
        # This line is the only difference from fix_segments.
        segment_map[proper_index] = i

    for mapping in segment_map.items():
        unfixed_segments[mapping[1]] = segments[mapping[0]]
    return unfixed_segments


def upgrade():
    bind = op.get_bind()
    session = Session(bind=bind)

    target_tracks_query = session.query(Track).filter(
        Track.is_current == True,
        Track.created_at < CUTOFF_DATE,
        jsonb_array_length(Track.track_segments) > 1000,
    )
    target_tracks = target_tracks_query.all()
    if len(target_tracks) > 2000:
        # Something is wrong here, we should not have this many. Back out.
        return

    logger.warning(f"Fixing {len(target_tracks)} target tracks")
    for track in target_tracks:
        track.track_segments = fix_segments(track.track_segments)
    session.commit()


def downgrade():
    bind = op.get_bind()
    session = Session(bind=bind)

    target_tracks_query = session.query(Track).filter(
        Track.is_current == True,
        Track.created_at < CUTOFF_DATE,
        jsonb_array_length(Track.track_segments) > 1000,
    )
    target_tracks = target_tracks_query.all()
    if len(target_tracks) > 2000:
        # Something is wrong here, we should not have this many. Back out.
        return

    logger.warning(f"Un-fixing {len(target_tracks)} target tracks")
    for track in target_tracks:
        track.track_segments = unfix_segments(track.track_segments)
    session.commit()
