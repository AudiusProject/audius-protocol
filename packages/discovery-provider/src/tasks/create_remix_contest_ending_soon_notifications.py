from datetime import datetime, timedelta

from src.models.events.event import Event, EventType
from src.models.notifications.notification import Notification
from src.models.social.follow import Follow
from src.models.social.save import Save, SaveType
from src.models.tracks.track import Track
from src.tasks.celery_app import celery
from src.utils.config import shared_config
from src.utils.structured_logger import StructuredLogger, log_duration

logger = StructuredLogger(__name__)
env = shared_config["discprov"]["env"]

REMIX_CONTEST_ENDING_SOON = "remix_contest_ending_soon"
REMIX_CONTEST_ENDING_SOON_WINDOW_HOURS = 72


def get_remix_contest_ending_soon_group_id(event_id):
    return f"{REMIX_CONTEST_ENDING_SOON}:{event_id}"


@log_duration(logger)
def _create_remix_contest_ending_soon_notifications(session):
    logger.info("Creating remix contest ending soon notifications")
    now = datetime.now()
    window_start = now
    window_end = now + timedelta(hours=REMIX_CONTEST_ENDING_SOON_WINDOW_HOURS)

    # Query for remix contest events ending in the next 72 hours
    ending_soon_contests = (
        session.query(Event)
        .filter(
            Event.event_type == EventType.remix_contest,
            Event.is_deleted == False,
            Event.end_date != None,
            Event.end_date.between(window_start, window_end),
        )
        .all()
    )

    new_notifications = []
    for event in ending_soon_contests:
        contest_track_id = event.entity_id
        # Get followers of the event creator
        follower_user_ids = set(
            row[0]
            for row in session.query(Follow.follower_user_id)
            .filter(
                Follow.followee_user_id == event.user_id,
                Follow.is_current == True,
                Follow.is_delete == False,
            )
            .all()
        )
        # Get users who saved the contest track
        favoriter_user_ids = set(
            row[0]
            for row in session.query(Save.user_id)
            .filter(
                Save.save_item_id == contest_track_id,
                Save.save_type == SaveType.track,
                Save.is_current == True,
                Save.is_delete == False,
            )
            .all()
        )
        notified_user_ids = follower_user_ids | favoriter_user_ids
        # Get the owner of the contest track
        parent_track = (
            session.query(Track)
            .filter(
                Track.track_id == contest_track_id,
                Track.is_current == True,
                Track.is_delete == False,
            )
            .first()
        )
        parent_track_owner_id = parent_track.owner_id if parent_track else None
        group_id = get_remix_contest_ending_soon_group_id(event.event_id)
        for user_id in notified_user_ids:
            exists = (
                session.query(Notification)
                .filter(
                    Notification.group_id == group_id,
                    Notification.type == REMIX_CONTEST_ENDING_SOON,
                    Notification.user_ids.any(user_id),
                )
                .first()
            )
            if not exists and parent_track_owner_id is not None:
                new_notification = Notification(
                    specifier=str(user_id),
                    group_id=group_id,
                    blocknumber=None,
                    user_ids=[user_id],
                    type=REMIX_CONTEST_ENDING_SOON,
                    data={
                        "entity_id": contest_track_id,
                        "entity_user_id": parent_track_owner_id,
                    },
                    timestamp=now,
                )
                new_notifications.append(new_notification)

    logger.info(
        f"Inserting {len(new_notifications)} remix contest ending soon notifications"
    )
    session.add_all(new_notifications)
    session.commit()


# ####### CELERY TASKS ####### #
@celery.task(name="create_remix_contest_ending_soon_notifications", bind=True)
def create_remix_contest_ending_soon_notifications(self):
    redis = create_remix_contest_ending_soon_notifications.redis
    db = create_remix_contest_ending_soon_notifications.db

    have_lock = False
    update_lock = redis.lock(
        "create_remix_contest_ending_soon_notifications_lock",
        blocking_timeout=25,
        timeout=600,
    )
    try:
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            with db.scoped_session() as session:
                _create_remix_contest_ending_soon_notifications(session)
        else:
            logger.info("Failed to acquire lock")
    except Exception as e:
        logger.error(f"Error creating remix contest ending soon notifications: {e}")
    finally:
        if have_lock:
            update_lock.release()
