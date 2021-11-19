import logging
import time
import sqlalchemy as sa
from src.tasks.celery_app import celery
from src.models import LatestSlots, Play

logger = logging.getLogger(__name__)

AGGREGATE_PLAYS_TABLE_NAME = "aggregate_plays"

### UPDATE_AGGREGATE_PLAYS_QUERY ###
# Get new plays that came after the previous most recent indexed slot for aggregate_play
# Group those new plays by play item id to get the aggregate play counts
# For new play item ids, insert those aggregate counts
# For existing play item ids, add the new aggregate count to the existing aggregate count
UPDATE_AGGREGATE_PLAYS_QUERY = """
    WITH aggregate_plays_latest_slot AS (
        SELECT
            :prev_latest_slot AS prev_latest_slot,
            :new_latest_slot AS new_latest_slot
    ),
    new_plays AS (
        SELECT
            play_item_id,
            count(play_item_id) AS count
        FROM
            plays p
        WHERE
            p.slot > (
                SELECT
                    prev_latest_slot
                FROM
                    aggregate_plays_latest_slot
            )
            AND p.slot <= (
                SELECT
                    new_latest_slot
                FROM
                    aggregate_plays_latest_slot
            )
        GROUP BY
            play_item_id
    )
    INSERT INTO
        aggregate_plays (play_item_id, count)
    SELECT
        new_plays.play_item_id,
        new_plays.count
    FROM
        new_plays ON CONFLICT (play_item_id) DO
    UPDATE
    SET
        count = aggregate_plays.count + EXCLUDED.count
    """

UPSERT_LATEST_SLOTS = """
    INSERT INTO latest_slots (tablename, slot)
    VALUES(:tablename, :slot)
    ON CONFLICT (tablename)
    DO UPDATE SET slot = EXCLUDED.slot;
    """

def _update_aggregate_plays(session):
    # get the last updated slot that counted towards the current aggregate plays
    prev_latest_slot = (session.query(LatestSlots.slot)
        .filter(LatestSlots.tablename == AGGREGATE_PLAYS_TABLE_NAME)
    ).scalar()

    if not prev_latest_slot:
        prev_latest_slot = 0

    # get the new latest
    new_latest_slot = (
        session.query(Play.slot)
        .filter(Play.slot != None)
        .order_by(Play.slot.desc()).limit(1)
    ).scalar()

    if not new_latest_slot:
        new_latest_slot = 0

    # update aggregate plays with new plays that came after the prev_latest_slot
    logger.info(f"index_aggregate_plays.py | Updating {AGGREGATE_PLAYS_TABLE_NAME}")

    session.execute(
        sa.text(UPDATE_AGGREGATE_PLAYS_QUERY),
        {
            "prev_latest_slot": int(prev_latest_slot),
            "new_latest_slot": int(new_latest_slot),
        },
    )

    # update latest_slots table with the new latest slot
    upsert_on_latest_slots = sa.text(UPSERT_LATEST_SLOTS)
    session.execute(
        upsert_on_latest_slots,
        {
            "tablename": AGGREGATE_PLAYS_TABLE_NAME,
            "slot": new_latest_slot,
        }
    )


######## CELERY TASKS ########
@celery.task(name="update_aggregate_plays", bind=True)
def update_aggregate_plays(self):
    # Cache custom task class properties
    # Details regarding custom task context can be found in wiki
    # Custom Task definition can be found in src/app.py
    db = update_aggregate_plays.db
    redis = update_aggregate_plays.redis
    # Define lock acquired boolean
    have_lock = False
    # Define redis lock object
    update_lock = redis.lock("index_aggregate_plays_lock", timeout=60 * 10)
    try:
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            start_time = time.time()

            with db.scoped_session() as session:
                _update_aggregate_plays(session)

            logger.info(
                f"index_aggregate_plays.py | Finished updating \
                {AGGREGATE_PLAYS_TABLE_NAME} in: {time.time()-start_time} sec"
            )
        else:
            logger.info(
                "index_aggregate_plays.py | Failed to acquire update_aggregate_plays"
            )
    except Exception as e:
        logger.error(
            "index_aggregate_plays.py | Fatal error in main loop", exc_info=True
        )
        raise e
    finally:
        if have_lock:
            update_lock.release()
