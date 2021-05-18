"""repair_poorly_sorted_tracks

Tracks on audius created before <X> date contain improperly sorted segments.
See https://github.com/AudiusProject/audius-protocol/commit/27576f58c4cdfa8e18e3f90f2c427d1e4a7eb51c
for the forward looking fix.

This migration retroactively repairs older tracks

Revision ID: c8d2be7dcccc
Revises: d9992d2d598c
Create Date: 2021-05-17 15:33:56.498582

"""
import logging
from alembic import op
from datetime import datetime
from sqlalchemy import Integer
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.sql.functions import GenericFunction
from sqlalchemy.orm import sessionmaker
from src.models import Track

# revision identifiers, used by Alembic.
revision = 'c8d2be7dcccc'
down_revision = 'd9992d2d598c'
branch_labels = None
depends_on = None

class jsonb_array_length(GenericFunction): # pylint: disable=too-many-ancestors
    name = 'jsonb_array_length'
    type = Integer

@compiles(jsonb_array_length, 'postgresql')
def compile_jsonb_array_length(element, compiler, **kw):
    return "%s(%s)" % (element.name, compiler.process(element.clauses))

logger = logging.getLogger(__name__)

Session = sessionmaker()
CUTOFF_DATE = datetime.fromtimestamp(1621371670)
FMT = "segment%03d.ts"

def fix_segments(segments):
    '''
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
    '''
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
    '''
    Un-fixes segments (for down migration).
    Identical to fix_segments, except proper_index and i are swapped to revert the change.
    '''
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

    target_tracks_query = (
        session.query(Track)
        .filter(
            Track.is_current == True,
            Track.created_at < CUTOFF_DATE,
            jsonb_array_length(Track.track_segments) > 1000
        )
    )
    target_tracks = target_tracks_query.all()
    if (len(target_tracks) > 2000):
        # Something is wrong here, we should not have this many. Back out.
        return

    logger.warn(f"Fixing {len(target_tracks)} target tracks")
    for track in target_tracks:
        track.track_segments = fix_segments(track.track_segments)
    session.commit()


def downgrade():
    bind = op.get_bind()
    session = Session(bind=bind)

    target_tracks_query = (
        session.query(Track)
        .filter(
            Track.is_current == True,
            Track.created_at < CUTOFF_DATE,
            jsonb_array_length(Track.track_segments) > 1000
        )
    )
    target_tracks = target_tracks_query.all()
    if (len(target_tracks) > 2000):
        # Something is wrong here, we should not have this many. Back out.
        return

    logger.warn(f"Un-fixing {len(target_tracks)} target tracks")
    for track in target_tracks:
        track.track_segments = unfix_segments(track.track_segments)
    session.commit()
