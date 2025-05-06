from datetime import datetime, timedelta

from src.models.events.event import Event, EventType
from src.models.notifications.notification import Notification
from src.models.tracks.track import Track
from src.tasks.celery_app import celery
from src.utils.config import shared_config
from src.utils.structured_logger import StructuredLogger, log_duration

logger = StructuredLogger(__name__)
env = shared_config["discprov"]["env"]

REMIX_CONTEST_ENDED = "remix_contest_ended"
REMIX_CONTEST_ENDED_WINDOW_HOURS = 24


def get_remix_contest_ended_group_id(event_id):
    return f"{REMIX_CONTEST_ENDED}:{event_id}"


@log_duration(logger)
def _create_remix_contest_ended_notifications(session):
    logger.info("Creating remix contest ended notifications")
    now = datetime.now()
    window_start = now - timedelta(hours=REMIX_CONTEST_ENDED_WINDOW_HOURS)
    window_end = now

    # Query for remix contest events that ended in the last 24 hours
    ended_contests = (
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
    for event in ended_contests:
        contest_track_id = event.entity_id
        # Find all users who submitted a remix to this contest (remix_of.tracks[].parent_track_id == contest_track_id)
        remixers = (
            session.query(Track.owner_id)
            .filter(
                Track.is_current == True,
                Track.is_delete == False,
                Track.remix_of != None,
                Track.remix_of["tracks"].contains(
                    [{"parent_track_id": contest_track_id}]
                ),
            )
            .all()
        )
        remixer_user_ids = {row[0] for row in remixers}
        for user_id in remixer_user_ids:
            group_id = get_remix_contest_ended_group_id(event.event_id)
            # Find the parent/original track and its owner (original artist)
            parent_track = (
                session.query(Track)
                .filter(
                    Track.track_id == event.entity_id,
                    Track.is_current == True,
                    Track.is_delete == False,
                )
                .first()
            )
            parent_track_owner_id = parent_track.owner_id if parent_track else None
            exists = (
                session.query(Notification)
                .filter(
                    Notification.group_id == group_id,
                    Notification.type == REMIX_CONTEST_ENDED,
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
                    type=REMIX_CONTEST_ENDED,
                    data={
                        "entity_id": event.entity_id,
                        "entity_user_id": parent_track_owner_id,
                    },
                    timestamp=now,
                )
                new_notifications.append(new_notification)

    logger.info(f"Inserting {len(new_notifications)} remix contest ended notifications")
    session.add_all(new_notifications)
    session.commit()


# ####### CELERY TASKS ####### #
@celery.task(name="create_remix_contest_ended_notifications", bind=True)
def create_remix_contest_ended_notifications(self):
    redis = create_remix_contest_ended_notifications.redis
    db = create_remix_contest_ended_notifications.db

    have_lock = False
    update_lock = redis.lock(
        "create_remix_contest_ended_notifications_lock",
        blocking_timeout=25,
        timeout=600,
    )
    try:
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            with db.scoped_session() as session:
                _create_remix_contest_ended_notifications(session)
        else:
            logger.info("Failed to acquire lock")
    except Exception as e:
        logger.error(f"Error creating remix contest ended notifications: {e}")
    finally:
        if have_lock:
            update_lock.release()
