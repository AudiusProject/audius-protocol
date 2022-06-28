import logging
import time
from typing import DefaultDict

import sqlalchemy as sa
from src.models.social.play import Play
from src.models.users.user_listening_history import UserListeningHistory
from src.tasks.celery_app import celery
from src.tasks.user_listening_history.listen_history import ListenHistory
from src.utils.update_indexing_checkpoints import (
    get_last_indexed_checkpoint,
    save_indexed_checkpoint,
)

logger = logging.getLogger(__name__)

USER_LISTENING_HISTORY_TABLE_NAME = "user_listening_history"
BATCH_SIZE = 100000  # index 100k plays at most at a time


def sort_listening_history(deduped_history_dict, limit=1000):
    # sorts listening history and places a limit
    deduped_history = []
    for track_id, timestamp in deduped_history_dict.items():
        deduped_history.append({"track_id": track_id, "timestamp": timestamp})
    deduped_history.sort(key=lambda listen: listen["timestamp"], reverse=True)
    return deduped_history[:limit]


def _index_user_listening_history(session):
    # get the last updated id that counted towards user_listening_history
    # use as lower bound
    prev_id_checkpoint = get_last_indexed_checkpoint(
        session, USER_LISTENING_HISTORY_TABLE_NAME
    )

    # get new plays since the last checkpoint
    new_plays = (
        session.query(Play.id, Play.user_id, Play.play_item_id, Play.created_at)
        .filter(Play.id > prev_id_checkpoint)
        .filter(Play.user_id != None)
        .order_by(sa.asc(Play.id))
        .limit(BATCH_SIZE)
    ).all()

    # no update exit early
    if not new_plays:
        return
    new_checkpoint = new_plays[-1].id  # get the highest play id

    # get existing user listening history for users with new plays
    users_with_new_plays = {new_play.user_id for new_play in new_plays}
    existing_user_listening_history = (
        session.query(UserListeningHistory)
        .filter(UserListeningHistory.user_id.in_(users_with_new_plays))
        .all()
    )
    existing_users = {
        user_history.user_id for user_history in existing_user_listening_history
    }

    # reduce new plays
    insert_user_listening_history_dict = DefaultDict(list)
    update_user_listening_history_dict = DefaultDict(list)
    for new_play in reversed(new_plays):
        listen_history = ListenHistory(
            new_play.play_item_id, new_play.created_at
        ).to_dict()

        if new_play.user_id in existing_users:
            update_user_listening_history_dict[new_play.user_id].append(listen_history)
        else:
            insert_user_listening_history_dict[new_play.user_id].append(listen_history)

    # make updates to existing users
    for i, user_history in enumerate(existing_user_listening_history):
        deduped_history_dict = {}
        for existing_play in reversed(user_history.listening_history):
            deduped_history_dict[existing_play["track_id"]] = existing_play["timestamp"]
        for new_play in reversed(
            update_user_listening_history_dict[user_history.user_id]
        ):
            deduped_history_dict[new_play["track_id"]] = new_play["timestamp"]
        existing_user_listening_history[i].listening_history = sort_listening_history(
            deduped_history_dict
        )

    # insert for new users
    new_user_listening_history = []
    for user, listening_history in insert_user_listening_history_dict.items():
        deduped_history_dict = {}
        for new_play in reversed(listening_history):
            deduped_history_dict[new_play["track_id"]] = new_play["timestamp"]

        new_user_listening_history.append(
            UserListeningHistory(
                user_id=user,
                listening_history=sort_listening_history(deduped_history_dict),
            )
        )
    session.add_all(new_user_listening_history)

    # update indexing_checkpoints with the new id
    save_indexed_checkpoint(session, USER_LISTENING_HISTORY_TABLE_NAME, new_checkpoint)


# ####### CELERY TASKS ####### #
@celery.task(name="index_user_listening_history", bind=True)
def index_user_listening_history(self):
    # Cache custom task class properties
    # Details regarding custom task context can be found in wiki
    # Custom Task definition can be found in src/app.py
    db = index_user_listening_history.db
    redis = index_user_listening_history.redis
    # Define lock acquired boolean
    have_lock = False
    # Define redis lock object
    update_lock = redis.lock("index_user_listening_history_lock", timeout=60 * 10)
    try:
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            logger.info(
                f"index_user_listening_history.py | Updating {USER_LISTENING_HISTORY_TABLE_NAME}"
            )
            start_time = time.time()

            with db.scoped_session() as session:
                _index_user_listening_history(session)

            logger.info(
                f"index_user_listening_history.py | Finished updating "
                f"{USER_LISTENING_HISTORY_TABLE_NAME} in: {time.time()-start_time} sec"
            )
        else:
            logger.info(
                "index_user_listening_history.py | Failed to acquire index_user_listening_history_lock"
            )
    except Exception as e:
        logger.error(
            "index_user_listening_history.py | Fatal error in main loop", exc_info=True
        )
        raise e
    finally:
        if have_lock:
            update_lock.release()
